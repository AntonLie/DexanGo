# Install

Monorepo (Turborepo + pnpm workspaces).

- Backend (`api-gateway`, `log-worker`) runs in Docker.
- Frontends (`employee-web`, `admin-web`) run locally via Vite.

## Requirements

- Node 18
- Docker
- pnpm

## 1. Clone

```bash
git clone <repo-url> DexanGo
cd DexanGo
```

## 2. Env vars

```bash
cp .env.example .env
cp apps/employee-web/.env.example apps/employee-web/.env
cp apps/admin-web/.env.example apps/admin-web/.env
```

## 3. Install dependencies

```bash
pnpm install
```

## 4. Start the backend

```bash
pnpm docker:up
```

## 5. Start the frontends

```bash
pnpm dev:web
```

- Employee portal → http://localhost:5173
- Admin portal → http://localhost:5174

## Test accounts

| Role      | Email         | Password    |
| --------- | ------------- | ----------- |
| HRD Admin | hrd@dexa.com  | password123 |
| Employee  | budi@dexa.com | password123 |
| Employee  | siti@dexa.com | password123 |
| Employee  | andi@dexa.com | password123 |
