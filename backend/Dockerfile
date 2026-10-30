# Stage 1: Dependencies
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: run as non-root user
USER node

COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node src ./src

EXPOSE 4000

CMD ["node", "server.js"]
