FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/user-service/package*.json ./packages/user-service/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies including dev dependencies for building
RUN npm install

# Copy source code
COPY packages/user-service/ ./packages/user-service/
COPY packages/shared/ ./packages/shared/

# Generate Prisma client from shared package first
WORKDIR /app/packages/shared
RUN npx prisma generate

# Build shared package first (after prisma generate)
RUN npm run build

# Build user service
WORKDIR /app/packages/user-service
RUN npm run build

# Remove dev dependencies after building
WORKDIR /app
RUN npm prune --production

EXPOSE 3005

WORKDIR /app/packages/user-service
CMD ["npm", "start"]