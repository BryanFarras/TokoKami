import express from "express";
import { db } from "../db.js";
const router = express.Router();

// Get all purchases with items
router.get("/", async (req, res) => {
  try {
    const [purchases] = await db.query("SELECT * FROM purchases ORDER BY date DESC");
    for (const p of purchases) {
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
    const { date, supplier, total_amount, notes, items } = req.body;
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO purchases (date, supplier, total_amount, notes) VALUES (?, ?, ?, ?)",
      [date, supplier, total_amount, notes]
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      await conn.query(
        "INSERT INTO purchase_items (purchase_id, raw_material_id, quantity, unit_cost, total) VALUES (?, ?, ?, ?, ?)",
        [purchaseId, item.rawMaterialId, item.quantity, item.unitCost, item.total]
      );
      // increase stock
      await conn.query(
        "UPDATE raw_materials SET stock = stock + ? WHERE id=?",
        [item.quantity, item.rawMaterialId]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Purchase recorded successfully" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Error recording purchase" });
  } finally {
    conn.release();
  }
});

export default router;
