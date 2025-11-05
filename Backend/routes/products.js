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
    await db.query(
      "INSERT INTO products (name, category, price, cost_price, stock, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, category, price, cost_price, stock, image]
    );
    res.status(201).json({ message: "Product added successfully" });
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
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  }
});

// ✅ Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id=?", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

export default router;
