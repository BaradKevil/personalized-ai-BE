# Novi Backend

> **Your AI, one step ahead.**

Private personal AI agent backend for Novi. Built with **Node.js + TypeScript + Express + Sequelize (MySQL)**, following the exact engineering conventions of the SmartOps-Pay backend (same team, same patterns, separate product, separate database).

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript 5 (strict) |
| Runtime | Node.js 20+ (tested on 24) |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| Database | MySQL 8 (`novi_ai`) |
| Validation | Joi |
| Auth | JWT (access + refresh rotation), bcryptjs hashing |
| Security | Helmet, CORS (strict allow-list in production, any localhost port in dev), rate limiting |
| AI | Provider abstraction (mock for dev, Groq when key present) |
| Package manager | npm |

## Project structure

Mirrors SmartOps-Pay exactly:

```
backend/
├── index.ts                  # server entry (DB test + listen)
├── app.ts                    # Express app configuration
├── config/
│   ├── index.ts              # centralized env configuration
│   ├── database.ts           # Sequelize instance + testConnection
│   └── sequelize-cli.config.js  # CLI-only config (CommonJS)
├── src/
│   ├── ai/                   # provider abstraction, prompts, context builder
│   ├── controllers/          # thin controllers (request → service → response)
│   ├── database/
│   │   ├── migrations/       # Sequelize migrations (JS, transactional)
│   │   └── seeders/          # empty (mirrors SmartOps-Pay)
│   ├── middlewares/          # auth, error, validate, rate-limit
│   ├── models/               # Sequelize models + index.ts (associations)
│   ├── routes/               # feature routers + index.ts
│   ├── services/             # business logic (auth, chat, memory, tasks, ...)
│   ├── utils/                # response handler, token utils, ip, serializers
│   └── validators/           # Joi schemas
```

## Setup

### 1. Prerequisites

- Node.js 20+ and npm
- MySQL 8 running locally

### 2. Create the database

The database must exist before migrations run:

```sql
CREATE DATABASE novi_ai
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

This is the only manual DB step. Migrations never create or drop databases.

### 3. Configure environment

```bash
cd backend
cp .env.example .env
# fill in real values
```

Required variables:

| Variable | Purpose |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL connection (`DB_NAME=novi_ai`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq AI (empty → mock provider is used) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |

### 4. Install and migrate

```bash
npm install
npx sequelize-cli db:migrate      # or: npm run db:migrate
```

### 5. Run

```bash
npm run dev        # ts-node via nodemon (http://localhost:3001)
npm run build      # tsc → dist/
npm start          # node dist/index.js
```

Health check: `GET http://localhost:3001/api/health`

## Database commands

```bash
# Generate a migration (every schema change must be a migration)
npx sequelize-cli migration:generate --name create-notifications-table

# Run migrations
npx sequelize-cli db:migrate

# Status / undo
npx sequelize-cli db:migrate:status
npx sequelize-cli db:migrate:undo          # undo last
npx sequelize-cli db:migrate:undo:all      # undo all (then re-migrate to rebuild)
```

Safety checklist before migrating: verify `DB_NAME=novi_ai` (never SmartOps-Pay's database), review the generated SQL, and never run destructive commands without explicit authorization.

## API overview

Base URL: `http://localhost:3001/api`

Response envelope (matches SmartOps-Pay):

```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "statusCode": 404, "message": "..." }
```

| Area | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout` |
| Users | `GET|PUT /users/profile` |
| Agent | `GET|PUT /agent` |
| Settings | `GET|PUT /settings` |
| Chat | `GET|POST /chat/conversations`, `PUT|DELETE /chat/conversations/:id`, `GET|POST /chat/conversations/:id/messages`, `POST /chat/conversations/:id/regenerate`, `PUT|DELETE /chat/messages/:id` |
| Memory | `GET|POST /memory`, `PUT|DELETE /memory/:id` (`?search=` supported) |
| Tasks | `GET|POST /tasks`, `PUT|DELETE /tasks/:id`, `POST /tasks/:id/toggle` |
| Goals | `GET|POST /goals`, `PUT|DELETE /goals/:id`, `POST /goals/:goalId/steps/:stepId/toggle` |
| Notifications | `GET /notifications`, `POST /notifications/read-all`, `GET /notifications/unread-count` |
| Activity logs | `GET /activity-logs?page=1&limit=20` |
| Daily briefing | `GET /daily-briefing` |

All routes except `/health` and `/auth/*` require `Authorization: Bearer <access_token>`.

### Auth flow

1. `POST /auth/register` with `{ name, mobile?, email, password, timezone? }` — creates the user **plus** their personal agent (default name **Novi**) and default preferences in one transaction.
2. `POST /auth/login` with `{ identifier, password }` (identifier = email **or** mobile number) → `{ user, agent, tokens }`.
3. Access tokens expire in 15m; `POST /auth/refresh-token` rotates the refresh token (revokes the old one in `user_tokens`).

## AI

The AI provider is pluggable via `src/ai/`. Providers implement `AIChatProvider`:

- **Mock provider** (default) — deterministic local responder for frontend integration.
- **Groq provider** — used automatically when `GROQ_API_KEY` is set and `AI_PROVIDER=groq`.

The `GROQ_API_KEY` lives only on the backend, never the frontend. The AI service:

- uses a centralized system prompt (`src/ai/prompts.ts`),
- builds bounded context from the user's **own** data only (`src/ai/context.ts`, max 20 recent messages),
- never invents facts — it must say "I don't have that information" when data is missing,
- handles rate limits / timeouts with limited exponential backoff and a user-safe fallback ("Novi is temporarily unable to respond. Please try again."),
- is only used where reasoning adds value — deterministic rules (e.g. overdue detection) never call the AI.

## Ownership & security

- Every personal table carries `user_id` and every read/write is scoped to the authenticated user (from the JWT, never from the request body).
- Cross-user access returns 404, never data.
- Passwords are bcrypt-hashed (cost 12) via a model hook; never stored or returned in plaintext.
- Joi validates every input (`stripUnknown: true`); IDs, payloads, and params are checked server-side.
- Rate limiting protects auth (10/15min) and AI endpoints (30/min). CORS allows any `localhost` port in development (the Vite dev server may pick e.g. 5174 when 5173 is busy) and falls back to the strict `CORS_ORIGIN` allow-list in production.
- Activity logs record important events (`USER_REGISTERED`, `TASK_COMPLETED`, `MEMORY_CREATED`, `AI_MESSAGE_SENT`, ...) without sensitive content.

## Testing

```bash
# Start the server in one terminal
PORT=3001 npm run dev

# In another, run the end-to-end smoke test
bash scripts/smoke-test.sh
```

The smoke test exercises auth, profile/agent/settings, chat, memory, tasks, goals, notifications, activity logs, daily briefing, cross-user ownership, and validation — printing PASS/FAIL counts and exiting non-zero on failure.

## Connecting the frontend

```bash
# frontend/.env.local
VITE_BASEURL=http://localhost:3001/api
VITE_DEMO_MODE=false
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNREFUSED` on startup | MySQL isn't running / wrong `DB_HOST`/`DB_PORT` |
| `Unknown database 'novi_ai'` | Run the `CREATE DATABASE` step |
| Server binds port 0 | A parent shell exports `PORT=0`; start with `PORT=3001 npm run dev` |
| `EADDRINUSE: address already in use` on start | Another instance is already running on port 3001. Stop it (or the process on that port) before starting a new one |
| Server exits with `💀 Server not started` | MySQL isn't reachable — check the DB service and `DB_*` env values |
| AI always says the demo line | `GROQ_API_KEY` not set → mock provider is active (expected until the key is configured) |
| Chat returns 503 | Groq is down/rate-limited; deterministic features still work |

## Roadmap (not yet implemented)

AI action framework (structured actions + approval), scheduler for proactive notifications, goal planning into tasks, password reset email flow, integrations (calendar/email/Notion), and vector search. The schema and service layer are structured so these slot in without rework.
