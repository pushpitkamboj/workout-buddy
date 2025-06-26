FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy shared source code
COPY packages/shared/ ./packages/shared/

# Copy .env file for database URL
COPY packages/shared/.env ./packages/shared/.env

# Build shared package and generate Prisma client
WORKDIR /app/packages/shared
RUN npm run prisma:generate
RUN npm run build

# Install production dependencies only
RUN npm install --only=production

# This service doesn't need to expose a port or run a server
# It's just for building shared utilities and Prisma client
CMD ["echo", "Shared package built successfully"]
