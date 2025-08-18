FROM node:22-alpine

WORKDIR /usr/src/app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

EXPOSE 3000
CMD ["node", "dist/main"]