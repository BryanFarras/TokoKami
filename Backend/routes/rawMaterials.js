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
    const [result] = await db.query("DELETE FROM raw_materials WHERE id=?", [req.params.id]);

    // MySQL returns affectedRows; if 0, id doesn't exist
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Raw material not found" });
    }

    res.json({ message: "Raw material deleted successfully" });
  } catch (err) {
    console.error("Delete raw_materials error:", err);

    // MySQL FK constraint error code
    if (err && (err.code === "ER_ROW_IS_REFERENCED" || err.errno === 1451)) {
      return res.status(409).json({
        message: "Cannot delete: material is referenced by other records (e.g., purchases).",
      });
    }

    res.status(500).json({ message: "Error deleting raw material" });
  }
});

export default router;
