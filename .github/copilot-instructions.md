# LMS Codebase Guidance for AI Agents

## Architecture Overview

This is a **full-stack LMS (Learning Management System)** deployed on Cloudflare Workers with a React frontend.

### Key Stack
- **Frontend**: React 19 + TanStack Router (file-based routing) + TanStack Query (data fetching) + Tailwind CSS + Radix UI
- **Backend**: Hono (lightweight web framework on Workers) + Drizzle ORM + Cloudflare D1 (SQLite)
- **Auth**: Better Auth (passwordless + email/password) with PBKDF2 password hashing
- **Build**: Vite + esbuild + TypeScript
- **Deployment**: Cloudflare Workers + wrangler

### Data Flow
1. React frontend (`src/react-app/`) calls API endpoints via axios
2. Hono router in `src/worker/index.ts` handles requests
3. Drizzle ORM queries Cloudflare D1 database
4. Better Auth manages sessions via HTTP-only cookies

## Critical Project Structure

```
src/
├── react-app/              # Frontend SPA
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── _auth/          # Auth routes (login, signup)
│   │   ├── _protected/     # Protected routes (auth required)
│   │   └── __root.tsx      # Root layout
│   ├── hooks/              # React Query mutations + queries
│   ├── lib/                # Utilities (api.ts, auth-client.ts)
│   └── constants/          # API endpoints + query keys
└── worker/                 # Backend
    ├── index.ts            # Hono routes
    ├── db/schema.ts        # Drizzle schema + migrations
    └── lib/auth.ts         # Better Auth configuration
```

## Essential Patterns

### 1. API Endpoints & Constants
- **Always** register API endpoints in `src/react-app/constants/api-endpoints.ts` as const object (e.g., `Tasks: "/api/tasks"`)
- **Always** add corresponding query keys in `src/react-app/constants/query-keys.ts` for React Query
- Follow the pattern: `QueryKeys.FeatureName` → used in `useQuery({ queryKey: [QueryKeys.FeatureName] })`

### 2. React Query Patterns
- Create custom hooks in `src/react-app/hooks/` (e.g., `use-tasks-query.ts`, `use-create-task-mutation.ts`)
- Use **Zod schemas** to validate API responses
- Mutations should call `queryClient.invalidateQueries()` to sync UI after mutations
- Example: `useCreateTaskMutation` in `src/react-app/hooks/use-create-task-mutation.ts`

### 3. Routing & Authentication
- Routes are **file-based** via TanStack Router in `src/react-app/routes/`
- `_auth.tsx` layout: checks `getSession()` - redirects to `/dashboard` if already logged in
- `_protected.tsx` layout: redirects to `/login` if no session
- Routes under `_protected/` require authentication
- **Critical**: Import `createFileRoute` from `@tanstack/react-router`, not `createRoute`

### 4. Backend Endpoints (Hono)
- All routes in `src/worker/index.ts`
- Use `zValidator("json", schema)` for request validation with Zod schemas
- **Always** call `getAuthUser(c)` to get authenticated user, return 401 if null
- Return `c.json()` for responses
- Database queries via `drizzle(c.env.DB)` - **DB binding required in wrangler.json**

### 5. Database & ORM
- Schema defined in `src/worker/db/schema.ts` (SQLite tables with Drizzle)
- **Enums** as string arrays: `export const userRoleEnum = ["admin", "trainer", "trainee"]`
- Foreign keys use `.references()` with cascade deletes where appropriate
- Timestamps stored as integers via `integer(..., { mode: "timestamp" })`
- Migrations auto-generated: `bun run db:generate`

### 6. Authentication Flow
- **Client**: `better-auth/react` client in `src/react-app/lib/auth-client.ts`
- **Server**: `betterAuth()` configured in `src/worker/lib/auth.ts` with drizzleAdapter
- Password hashing: Custom PBKDF2 implementation (salt + 100k iterations + SHA-256)
- Session validation: `getAuthUser()` utility checks headers for session token

## Development Workflows

### Build & Deploy
```bash
bun run dev              # Start Vite dev server (http://localhost:5173)
bun run build            # Build frontend + worker (TypeScript check via tsc -b)
bun run check            # Type check, build, + dry-run deploy
bun run deploy           # Deploy to Cloudflare Workers
```

### Database
```bash
bun run db:generate      # Generate migrations from schema changes
bun run db:migrate:local # Apply migrations locally
bun run db:migrate:prod  # Apply migrations to production D1
```

### Code Quality
```bash
bun run lint             # ESLint check
bun run cf-typegen       # Generate Cloudflare Worker types
```

## Important Configuration Files

- **`wrangler.json`**: Defines D1 database binding `DB`, routes assets to `dist/client/`
- **`vite.config.ts`**: TanStack Router plugin auto-generates `routeTree.gen.ts` from `src/react-app/routes/`
- **`drizzle.config.ts`**: Points to schema at `src/worker/db/schema.ts`, uses D1 HTTP driver
- **`tsconfig.json`**: Path alias `@` → `src/react-app/` for imports

## Common Pitfalls to Avoid

1. **Routing**: Use `_protected` layout for routes requiring auth, not manual checks
2. **Query Keys**: Always add to constants before using in hooks - enables cache invalidation
3. **Validation**: Use Zod schemas for **both** request validation (server) and response parsing (client)
4. **Database Queries**: Must initialize `drizzle(c.env.DB)` with schema for proper typing
5. **API Calls**: Use `axios` instance from `src/react-app/lib/api.ts`, not direct axios imports
6. **Mutations**: Always invalidate relevant query keys after success to sync UI state
