import express from "express";
import { db } from "../db.js";
const router = express.Router();

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transactions ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ message: "Error fetching transactions", error: err.message });
  }
});

// Checkout (create sale)
router.post("/checkout", async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const {
      discount,
      tax,
      payment_method,
      cashier_name,
      customer_name,
      notes,
      items
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items cannot be empty" });
    }
    if (!payment_method || !cashier_name) {
      return res.status(400).json({ message: "Payment method and cashier name are required" });
    }

    await conn.beginTransaction();

    let subtotal = 0;
    let profit = 0;

    // Validate and process items
    for (const item of items) {
      const [rows] = await conn.query("SELECT * FROM products WHERE id=?", [item.productId]);
      if (!rows || rows.length === 0) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      const product = rows[0];
      
      // Check if stock is sufficient
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
      
      subtotal += product.price * item.quantity;
      profit += (product.price - product.cost_price) * item.quantity;
      
      await conn.query("UPDATE products SET stock = stock - ? WHERE id=?", [item.quantity, item.productId]);
      
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

    const total = subtotal - (discount || 0) + (tax || 0);

    const [tx] = await conn.query(
      "INSERT INTO transactions (date, subtotal, discount, tax, total, profit, payment_method, cashier_name, customer_name, notes) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [subtotal, discount || 0, tax || 0, total, profit, payment_method, cashier_name, customer_name || null, notes || null]
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
    res.status(201).json({ message: "Checkout completed successfully", transactionId });
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Checkout failed", error: err.message });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

export default router;
