# Sử dụng Node.js phiên bản LTS
FROM node:18-alpine

# Cài đặt curl để health check
RUN apk add --no-cache curl

# Tạo thư mục app
WORKDIR /app

# Copy package.json và package-lock.json (nếu có)
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Tạo user non-root để bảo mật
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Tạo thư mục uploads và set permissions
RUN mkdir -p uploads/avatars && \
    chown -R backend:nodejs uploads && \
    chmod -R 755 uploads

# Chuyển sang user non-root
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start command
CMD ["npm", "start"]
