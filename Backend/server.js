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
<<<<<<< HEAD
    console.error("Database test failed:", err.message);
    res.status(500).json({ message: "DB connection failed", error: err.message });
=======
    console.error(err);
    res.status(500).json({ message: "DB connection failed" });
>>>>>>> cfcf8846cfc95db63deb847b9495687bfb90927e
  }
});

// product endpoints
app.use("/products", productsRoutes);
app.use("/raw-materials", rawMaterialsRoutes);
app.use("/purchases", purchasesRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/auth", authRoutes);

<<<<<<< HEAD
// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 4000;

// Test database connection before starting server
db.query("SELECT 1")
  .then(() => {
    console.log("✓ Database connection successful");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ Database connection failed:", err.message);
    console.error("Please check your database credentials and network connection.");
    process.exit(1);
  });
=======
app.listen(process.env.PORT || 4000, () =>
    console.log(`Server running on port ${process.env.PORT || 4000}`)
);
>>>>>>> cfcf8846cfc95db63deb847b9495687bfb90927e
