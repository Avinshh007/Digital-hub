# Stage 1: Build Angular Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Express Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps
COPY backend/ ./
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy built backend files and prisma client
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY --from=backend-builder /app/backend/package.json /app/backend/package.json
COPY --from=backend-builder /app/backend/prisma /app/backend/prisma

# Copy built frontend files
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose both backend port (3001) and frontend SSR port (4000)
EXPOSE 3001 4000

# Copy start runner script
COPY start-prod.js ./

# Define environment variables
ENV NODE_ENV=production

# Start command
CMD ["node", "start-prod.js"]
