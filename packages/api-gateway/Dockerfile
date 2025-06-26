FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/api-gateway/package*.json ./packages/api-gateway/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/api-gateway/ ./packages/api-gateway/
COPY packages/shared/ ./packages/shared/

# Build shared package first
WORKDIR /app/packages/shared
RUN npm run build

# Build api gateway
WORKDIR /app/packages/api-gateway
RUN npm run build

# Install production dependencies
RUN npm install --only=production

EXPOSE 3000

CMD ["npm", "start"]