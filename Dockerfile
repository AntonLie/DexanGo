FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @dexago/shared build \
    && pnpm --filter @dexago/api-gateway db:generate \
    && pnpm --filter @dexago/log-worker db:generate \
    && pnpm --filter @dexago/api-gateway build \
    && pnpm --filter @dexago/log-worker build

RUN mkdir -p /app/services/api-gateway/uploads

EXPOSE 3001 3002

CMD ["node", "services/api-gateway/dist/main.js"]
