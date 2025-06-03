# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json .npmrc ./

# Install dependencies (using force flag as mentioned)
RUN npm ci --force

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
# We must ensure MONGODB_URL is set during build time
ARG MONGODB_URL
ENV MONGODB_URL=${MONGODB_URL}
ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ARG NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_APP_BASE_URL=${NEXT_PUBLIC_APP_BASE_URL}
ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ARG UPSTASH_REDIS_REST_URL
ENV UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
ARG UPSTASH_REDIS_REST_TOKEN
ENV UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}

# Build application
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user for better security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the build output and necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables for runtime
ENV PORT 3000

# Start the application
CMD ["npm", "start"]