import express from "express";
import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const SECRET = process.env.JWT_SECRET; // use env var in production

if (!SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// Helpers: auth and role guards
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing token" });
    }
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin only" });
  }
  next();
}

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET,
      { expiresIn: "8h" }
    );

    // Return safe user (no password)
    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// (optional) register
router.post("/register", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) {
      return res.status(409).json({ message: "Email already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role]
    );
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// new: get current user from Bearer token
router.get("/me", requireAuth, (req, res) => {
  try {
    // payload contains id,name,email,role per login token
    return res.json(req.user);
  } catch (err) {
    console.error("auth/me error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Admin: list all users (safe fields)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role FROM users ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error("List users failed:", err);
    res.status(500).json({ message: "Failed to list users" });
  }
});

// Update a user (admin can update anyone; non-admin only themselves)
router.patch("/users/:id", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const actingIsAdmin = req.user?.role === "admin";
  const actingIsSelf = req.user?.id === targetId;

  if (!actingIsAdmin && !actingIsSelf) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { name, email, password, role } = req.body || {};
  const updates = [];
  const params = [];

  try {
    // Non-admins cannot change role
    if (typeof role !== "undefined") {
      if (!actingIsAdmin) {
        return res.status(403).json({ message: "Only admin can change role" });
      }
      updates.push("role=?");
      params.push(role);
    }

    if (typeof name !== "undefined") {
      updates.push("name=?");
      params.push(name);
    }

    if (typeof email !== "undefined") {
      // Ensure email uniqueness
      const [dupes] = await db.query("SELECT id FROM users WHERE email=? AND id<>?", [email, targetId]);
      if (dupes.length) {
        return res.status(409).json({ message: "Email already in use" });
      }
      updates.push("email=?");
      params.push(email);
    }

    if (password && String(password).length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push("password=?");
      params.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id=?`, [...params, targetId]);

    const [rows] = await db.query("SELECT id, name, email, role FROM users WHERE id=?", [targetId]);
    const updated = rows[0];
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json(updated);
  } catch (err) {
    console.error("Update user failed:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// Delete a user (admin only; cannot delete self)
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (req.user?.id === targetId) {
    return res.status(400).json({ message: "Admins cannot delete themselves" });
  }

  try {
    const [exists] = await db.query("SELECT id FROM users WHERE id=?", [targetId]);
    if (!exists.length) return res.status(404).json({ message: "User not found" });

    await db.query("DELETE FROM users WHERE id=?", [targetId]);
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user failed:", err);
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
