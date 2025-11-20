import express from "express";
import { db } from "../db.js";

const router = express.Router();

// ✅ Get all products
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// ✅ Add a new product
router.post("/", async (req, res) => {
  try {
    const { name, category, price, cost_price, stock, image } = req.body;
    const [result] = await db.query(
      "INSERT INTO products (name, category, price, cost_price, stock, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, category, price, cost_price, stock, image]
    );
    const insertId = result.insertId;
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding product" });
  }
});

// ✅ Update a product
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, cost_price, stock, image } = req.body;
    await db.query(
      "UPDATE products SET name=?, category=?, price=?, cost_price=?, stock=?, image=? WHERE id=?",
      [name, category, price, cost_price, stock, image, id]
    );
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  }
});

// ✅ Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Fetch the product first so we can return it after deletion
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    const product = rows[0];
    await db.query("DELETE FROM products WHERE id=?", [id]);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

export default router;
