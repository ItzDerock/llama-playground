## Base image
FROM node:18-alpine AS base

# Install package manager
RUN npm i --global --no-update-notifier --no-fund pnpm

# Set the working directory
WORKDIR /app

## Builder image
FROM base AS web-builder

# Copy the package.json and package-lock.json
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install the dependencies
RUN pnpm install --frozen-lockfile

# Copy the source code
COPY . .

# Build the app
RUN npm run build

## Builder for llama-cpp
FROM alpine:3.14 AS llama-cpp-builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    make \
    git 

# Set the working directory
WORKDIR /app

# Clone the repository
RUN git clone --depth 1 --branch tcp_server \
    https://github.com/ggerganov/llama.cpp.git .

# Build
RUN make

# Production image based on alpine node:18
FROM base AS production

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --production

# Copy all the built files
COPY --from=llama-cpp-builder /app/main ./bin/main
COPY --from=web-builder /app/ ./
# COPY --from=web-builder /app/dist ./dist
# COPY --from=web-builder /app/.next ./.next
# COPY --from=web-builder /app/public ./public
# COPY --from=web-builder /app/scripts ./scripts
# COPY --from=web-builder /app/src/env.mjs ./src/env.mjs

# Default environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Done
CMD ["pnpm", "run", "start"]