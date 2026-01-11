/**
 * Global Error Handler Middleware
 * Xử lý tất cả errors và trả về response chuẩn hóa
 */

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Lỗi server nội bộ";
  let errors = null;

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Dữ liệu không hợp lệ";
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `ID không hợp lệ: ${err.value}`;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} đã tồn tại`;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token không hợp lệ";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token đã hết hạn";
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorHandler;
