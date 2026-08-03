# --- Build & run the CUTM Mentor-Mentee Platform ---
FROM node:20-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# App source
COPY . .

# Build the Next.js production bundle
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Seed demo data (idempotent) then start. Mongo must be reachable via MONGODB_URI.
CMD ["sh", "-c", "node scripts/seed.js --demo || true; npm start"]
