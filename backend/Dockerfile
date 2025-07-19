# ===========================================
# Multi-stage Dockerfile for Backend
# ===========================================

# Base stage - Common setup
FROM node:18-alpine AS base

# Cài đặt curl để health check
RUN apk add --no-cache curl

# Tạo thư mục app
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# ===========================================
# Development stage
# ===========================================
FROM base AS development

# Cài đặt tất cả dependencies (bao gồm devDependencies)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Tạo thư mục uploads
RUN mkdir -p uploads/avatars

# Expose port
EXPOSE 5000

# Start development server với nodemon
CMD ["npm", "run", "dev"]

# ===========================================
# Build stage
# ===========================================
FROM base AS build

# Cài đặt dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# ===========================================
# Production stage
# ===========================================
FROM node:18-alpine AS production

# Cài đặt curl để health check
RUN apk add --no-cache curl

# Tạo thư mục app
WORKDIR /app

# Tạo user non-root để bảo mật
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy built application từ build stage
COPY --from=build --chown=backend:nodejs /app .

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
