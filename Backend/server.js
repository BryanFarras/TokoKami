import express from "express";
import cors from "cors";
import { db } from "./db.js";
import productsRoutes from "./routes/products.js";
import rawMaterialsRoutes from "./routes/rawMaterials.js";
import purchasesRoutes from "./routes/purchases.js";
import transactionsRoutes from "./routes/transactions.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

// test DB connection
app.get("/test-db", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ message: "Database connected!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB connection failed" });
  }
});

// product endpoints
app.use("/products", productsRoutes);
app.use("/raw-materials", rawMaterialsRoutes);
app.use("/purchases", purchasesRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/auth", authRoutes);

app.listen(process.env.PORT || 4000, () =>
    console.log(`Server running on port ${process.env.PORT || 4000}`)
);
