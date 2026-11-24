FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
ENV HUSKY=0
RUN if [ ! -f package-lock.json ]; then echo "Root package-lock.json is required. Generate it with your manual workspace installation before building."; exit 1; fi && npm ci --no-fund
COPY backend backend
COPY frontend/src/config/assets.ts frontend/src/config/assets.ts
COPY frontend/src/lib/data.ts frontend/src/lib/data.ts
RUN npm run db:generate -w backend && npm run build -w backend
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/backend ./backend
COPY --from=build --chown=node:node /app/frontend/src ./frontend/src
USER node
WORKDIR /app/backend
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","dist/server.js"]
