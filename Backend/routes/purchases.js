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
    const { date, supplier, notes, items } = req.body;

    await conn.beginTransaction();

    // Calculate total purchase cost
    let purchaseTotal = 0;

    const [result] = await conn.query(
      "INSERT INTO purchases (date, supplier, total_amount, notes) VALUES (?, ?, 0, ?)",
      [date, supplier, notes]
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      // Accept both camelCase and snake_case
      const rawMaterialId =
        item.raw_material_id || item.rawMaterialId || item.id;

      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost || item.unitCost) || 0;
      const itemTotal = quantity * unitCost;

      purchaseTotal += itemTotal;

      await conn.query(
        "INSERT INTO purchase_items (purchase_id, raw_material_id, quantity, unit_cost, total) VALUES (?, ?, ?, ?, ?)",
        [purchaseId, rawMaterialId, quantity, unitCost, itemTotal]
      );

      await conn.query(
        "UPDATE raw_materials SET stock = stock + ? WHERE id = ?",
        [quantity, rawMaterialId]
      );
    }

    // Update total purchase amount
    await conn.query(
      "UPDATE purchases SET total_amount = ? WHERE id = ?",
      [purchaseTotal, purchaseId]
    );

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