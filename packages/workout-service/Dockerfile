FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/workout-service/package*.json ./packages/workout-service/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/workout-service/ ./packages/workout-service/
COPY packages/shared/ ./packages/shared/

# Generate Prisma client from shared package first
WORKDIR /app/packages/shared
RUN npx prisma generate

# Build shared package first (after prisma generate)
RUN npm run build

# Build workout service
WORKDIR /app/packages/workout-service
RUN npm run build

# Install production dependencies
RUN npm install --only=production

EXPOSE 3006

CMD ["npm", "start"]