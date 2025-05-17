const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quản lý chi tiêu cá nhân - API Docs",
      version: "1.0.0",
      description: "Tài liệu API cho hệ thống backend NodeJS",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // Quét các route để lấy mô tả
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
