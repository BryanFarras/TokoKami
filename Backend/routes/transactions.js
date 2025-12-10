import express from "express";
import { db } from "../db.js";
const router = express.Router();

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// Checkout (create sale)
router.post("/checkout", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      discount,
      tax,
      payment_method,
      cashier_name,
      customer_name,
      notes,
      items
    } = req.body;

    await conn.beginTransaction();

    let subtotal = 0;
    let profit = 0;

    // calculate totals and get product data
    for (const item of items) {
      const [rows] = await conn.query("SELECT * FROM products WHERE id=?", [item.productId]);
      const product = rows[0];
      subtotal += product.price * item.quantity;
      profit += (product.price - product.cost_price) * item.quantity;
      
      // ✅ Kurangi stock produk
      await conn.query("UPDATE products SET stock = stock - ? WHERE id=?", [item.quantity, item.productId]);
      
      // ✅ BARU: Kurangi raw materials berdasarkan resep (product_ingredients)
      const [ingredients] = await conn.query(
        "SELECT raw_material_id, amount FROM product_ingredients WHERE product_id=?",
        [item.productId]
      );
      
      for (const ingredient of ingredients) {
        const totalAmountNeeded = ingredient.amount * item.quantity;
        await conn.query(
          "UPDATE raw_materials SET stock = stock - ? WHERE id=?",
          [totalAmountNeeded, ingredient.raw_material_id]
        );
      }
    }

    const total = subtotal - discount + tax;

    const [tx] = await conn.query(
      "INSERT INTO transactions (date, subtotal, discount, tax, total, profit, payment_method, cashier_name, customer_name, notes) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [subtotal, discount, tax, total, profit, payment_method, cashier_name, customer_name, notes]
    );

    const transactionId = tx.insertId;

    for (const item of items) {
      const [rows] = await conn.query("SELECT * FROM products WHERE id=?", [item.productId]);
      const product = rows[0];
      await conn.query(
        "INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, unit_price, cost_price, total_price, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          transactionId,
          product.id,
          product.name,
          item.quantity,
          product.price,
          product.cost_price,
          product.price * item.quantity,
          (product.price - product.cost_price) * item.quantity
        ]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Checkout completed successfully" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Checkout failed" });
  } finally {
    conn.release();
  }
});

export default router;
