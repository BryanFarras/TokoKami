import express from "express";
import { db } from "../db.js";
const router = express.Router();

// Get all raw materials
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM raw_materials");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching raw materials" });
  }
});

// Add a raw material
router.post("/", async (req, res) => {
  try {
    const { name, unit, stock, unit_cost, supplier } = req.body;
    await db.query(
      "INSERT INTO raw_materials (name, unit, stock, unit_cost, supplier) VALUES (?, ?, ?, ?, ?)",
      [name, unit, stock, unit_cost, supplier]
    );
    res.status(201).json({ message: "Raw material added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding raw material" });
  }
});

// Update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, stock, unit_cost, supplier } = req.body;
    await db.query(
      "UPDATE raw_materials SET name=?, unit=?, stock=?, unit_cost=?, supplier=? WHERE id=?",
      [name, unit, stock, unit_cost, supplier, id]
    );
    res.json({ message: "Raw material updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating raw material" });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM raw_materials WHERE id=?", [req.params.id]);
    res.json({ message: "Raw material deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting raw material" });
  }
});

export default router;
