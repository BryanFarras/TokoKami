import express from "express";
import { db } from "../db.js";

const router = express.Router();

// ✅ Get all products (include ingredients)
router.get("/", async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products");

    const [ings] = await db.query(`
      SELECT pi.product_id, pi.raw_material_id, pi.amount,
             rm.name AS rm_name, rm.unit AS rm_unit, rm.unit_cost AS rm_unit_cost
      FROM product_ingredients pi
      JOIN raw_materials rm ON rm.id = pi.raw_material_id
    `);

    const ingredientsByProduct = {};
    for (const row of ings) {
      const pid = String(row.product_id);
      ingredientsByProduct[pid] = ingredientsByProduct[pid] || [];
      ingredientsByProduct[pid].push({
        raw_material_id: String(row.raw_material_id),
        amount: Number(row.amount),
        raw_material: {
          id: String(row.raw_material_id),
          name: row.rm_name,
          unit: row.rm_unit,
          unit_cost: Number(row.rm_unit_cost ?? 0),
        },
      });
    }

    const withIngredients = products.map(p => ({
      ...p,
      ingredients: ingredientsByProduct[String(p.id)] || [],
    }));

    res.json(withIngredients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// ✅ Add a new product (with ingredients)
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name, category, price, cost_price, stock, image, ingredients = [] } = req.body;
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO products (name, category, price, cost_price, stock, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, category, price, cost_price, stock, image]
    );
    const insertId = result.insertId;

    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        await conn.query(
          "INSERT INTO product_ingredients (product_id, raw_material_id, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)",
          [insertId, Number(ing.raw_material_id), Number(ing.amount || 0)]
        );
      }
    }

    await conn.commit();

    const [rows] = await conn.query("SELECT * FROM products WHERE id = ?", [insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Error adding product" });
  } finally {
    conn.release();
  }
});

// ✅ Update a product (and its ingredients)
router.put("/:id", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { name, category, price, cost_price, stock, image, ingredients = [] } = req.body;

    await conn.beginTransaction();

    await conn.query(
      "UPDATE products SET name=?, category=?, price=?, cost_price=?, stock=?, image=? WHERE id=?",
      [name, category, price, cost_price, stock, image, id]
    );

    // Replace ingredients set
    await conn.query("DELETE FROM product_ingredients WHERE product_id=?", [id]);
    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        await conn.query(
          "INSERT INTO product_ingredients (product_id, raw_material_id, amount) VALUES (?, ?, ?)",
          [id, Number(ing.raw_material_id), Number(ing.amount || 0)]
        );
      }
    }

    await conn.commit();

    const [rows] = await conn.query("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  } finally {
    conn.release();
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
