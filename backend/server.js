const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });
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

const categoryRoutes = require("./routes/category");
app.use("/api/categories", categoryRoutes);

const accountRoutes = require("./routes/accounts");
app.use("/api/accounts", accountRoutes);

const transactionRoutes = require("./routes/transactions");
app.use("/api/transactions", transactionRoutes);

const { swaggerUi, swaggerSpec, swaggerUIOptions } = require("./swagger");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUIOptions)
);

// const statsRoutes = require("./routes/stats");
// app.use("/api/stats", statsRoutes);
const statisticsRoutes = require("./routes/statistics.routes");
app.use("/api/statistics", statisticsRoutes);

app.use("/api/goals", require("./routes/goalRoutes"));

const aiRoutes = require("./routes/ai");
app.use("/api/ai-assistant", aiRoutes);

const setupRoutes = require("./routes/setup");
app.use("/api/setup", setupRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", require("./routes/userRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
