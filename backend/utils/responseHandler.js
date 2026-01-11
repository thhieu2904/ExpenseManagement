/**
 * Centralized Response Handler for RESTful API
 * Chuẩn hóa response format cho toàn bộ API
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
exports.success = (
  res,
  data = null,
  message = "Thành công",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} errors - Additional error details
 */
exports.error = (
  res,
  message = "Lỗi server",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 */
exports.paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
};

/**
 * Created response (201)
 */
exports.created = (res, data, message = "Tạo thành công") => {
  return exports.success(res, data, message, 201);
};

/**
 * Not found response (404)
 */
exports.notFound = (res, message = "Không tìm thấy") => {
  return exports.error(res, message, 404);
};

/**
 * Bad request response (400)
 */
exports.badRequest = (res, message = "Dữ liệu không hợp lệ", errors = null) => {
  return exports.error(res, message, 400, errors);
};

/**
 * Unauthorized response (401)
 */
exports.unauthorized = (res, message = "Không có quyền truy cập") => {
  return exports.error(res, message, 401);
};
