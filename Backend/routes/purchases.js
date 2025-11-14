import express from "express";
import { db } from "../db.js";
const router = express.Router();

// Get all purchases with items
router.get("/", async (req, res) => {
  try {
    // Pastikan kolom di DB bernama 'total_amount'
    const [purchases] = await db.query("SELECT * FROM purchases ORDER BY date DESC");
    for (const p of purchases) {
      // Pastikan kolom di DB bernama 'unit_cost', 'raw_material_id', 'total'
      const [items] = await db.query("SELECT * FROM purchase_items WHERE purchase_id=?", [p.id]);
      p.items = items;
    }
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching purchases" });
  }
});

// Record a purchase
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    // PERBAIKAN 1A: Menerima totalAmount (camelCase) dari frontend
    const { date, supplier, totalAmount, notes, items } = req.body; 
    
    // Pastikan totalAmount adalah angka dan tidak null
    const finalTotalAmount = Number(totalAmount) || 0;

    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO purchases (date, supplier, total_amount, notes) VALUES (?, ?, ?, ?)",
      [date, supplier, finalTotalAmount, notes] // Menggunakan finalTotalAmount
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      // PERBAIKAN 1B: Menggunakan nama field snake_case yang dikirim dari frontend
      // Item yang dikirim: raw_material_id, unit_cost
      const finalUnitCost = Number(item.unit_cost) || 0; 
      const finalTotal = Number(item.total) || 0; 

      await conn.query(
        "INSERT INTO purchase_items (purchase_id, raw_material_id, quantity, unit_cost, total) VALUES (?, ?, ?, ?, ?)",
        [
          purchaseId, 
          item.raw_material_id, // Gunakan raw_material_id dari payload frontend
          item.quantity, 
          finalUnitCost,        // Gunakan unit_cost dari payload frontend
          finalTotal
        ]
      );
      
      // increase stock
      await conn.query(
        "UPDATE raw_materials SET stock = stock + ? WHERE id=?",
        [item.quantity, item.raw_material_id] // Gunakan raw_material_id dari payload frontend
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Purchase recorded successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("Error in purchase POST:", err);
    res.status(500).json({ message: "Error recording purchase" });
  } finally {
    conn.release();
  }
});

export default router;