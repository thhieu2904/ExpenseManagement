const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend is running..." });
});

// API Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const categoryRoutes = require("./routes/category");
app.use("/api/categories", categoryRoutes);

const accountRoutes = require("./routes/accounts");
app.use("/api/accounts", accountRoutes);

const transactionRoutes = require("./routes/transactions");
app.use("/api/transactions", transactionRoutes);

const statisticsRoutes = require("./routes/statistics.routes");
app.use("/api/statistics", statisticsRoutes);

app.use("/api/goals", require("./routes/goalRoutes"));

const aiRoutes = require("./routes/ai");
app.use("/api/ai-assistant", aiRoutes);

const setupRoutes = require("./routes/setup");
app.use("/api/setup", setupRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// Swagger API Documentation
const { swaggerUi, swaggerSpec, swaggerUIOptions } = require("./swagger");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUIOptions)
);

// Global Error Handler - phải đặt SAU tất cả routes
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
