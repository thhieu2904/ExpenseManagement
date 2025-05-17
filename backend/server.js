const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const categoryRoutes = require("./routes/categories");
app.use("/api/categories", categoryRoutes);

const accountRoutes = require("./routes/accounts");
app.use("/api/accounts", accountRoutes);

const transactionRoutes = require("./routes/transactions");
app.use("/api/transactions", transactionRoutes);

const { swaggerUi, swaggerSpec } = require("./swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const statsRoutes = require("./routes/stats");
app.use("/api/stats", statsRoutes);
