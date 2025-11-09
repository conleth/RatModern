# OWASP RAT Modern

OWASP RAT Modern is a modernized reference implementation for automating OWASP ASVS task management. It pairs a role-aware React UI (shadcn/ui + Tailwind) with a lightweight Fastify backend that exposes ASVS checklists and a pluggable ticketing integration layer. The initial adapter targets Broadcom Rally using OAuth, and the backend is intentionally structured so additional systems (e.g., Jira) can be swapped in with minimal friction.

## Repository layout

```
.
├── frontend/   # Vite + React + shadcn/ui experience
└── backend/    # Fastify API + ticketing adapters
```

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment variables:

- `VITE_API_BASE_URL` – defaults to `http://localhost:4000` when unset.

### Backend

```bash
cd backend
npm install
npm run dev
```

Key environment variables (see `.env.example` below):

- `PORT` (default `4000`)
- `CLIENT_ORIGIN` (default `http://localhost:5173`)
- `RALLY_CLIENT_ID`
- `RALLY_CLIENT_SECRET`
- `RALLY_REDIRECT_URI`
- `MOCK_USER_ID`, `MOCK_USER_NAME`, `MOCK_USER_EMAIL`, `MOCK_USER_ROLE` (optional: enables environment-driven login for local development)
- Frontend fallback (no backend): `VITE_MOCK_USER_ID`, `VITE_MOCK_USER_NAME`, `VITE_MOCK_USER_EMAIL`, `VITE_MOCK_USER_ROLE`
- Optional overrides: `RALLY_AUTHORIZE_URL`, `RALLY_TOKEN_URL`, `RALLY_API_BASE_URL`

Create a `.env` file or export the variables before starting the server.

## Ticketing adapter design

Adapters live under `backend/src/ticketing`. Each adapter implements the `TicketingAdapter` interface:

- `exchangeCode` – Exchanges an OAuth authorization code for access/refresh tokens.
- `linkTask` – Connects an ASVS task to a work item in the target system.
- `getWorkItem` – Fetches extra metadata as needed.

The Rally adapter (`adapters/rallyAdapter.ts`) handles OAuth token exchange and demonstrates a simple task-linking request. To register a new adapter (e.g., Jira), create a factory and use `registerTicketingAdapter("jira", createJiraAdapter)` during server bootstrap.

## OAuth flow (Rally)

1. The frontend sends users to `/oauth/rally/authorize`.
2. Rally redirects to `/oauth/rally/callback` with a code.
3. The frontend POSTs the code to `/oauth/rally/token`.
4. The backend uses the Rally adapter to exchange the code for an access token, returning it to the client.
5. Subsequent ticketing actions (e.g., `/ticketing/rally/link`) supply the access token via the `Authorization: Bearer ...` header.

Security notes:

- Always store secrets outside of the repository (e.g., `.env` injected at runtime).
- Consider persisting refresh tokens server-side (database or vault) instead of sending them to the client.
- Add CSRF protection and PKCE when moving beyond local prototyping.

## Frontend overview

- Shadcn/ui + Tailwind for consistent role-based navigation.
- React Router manages `Login`, `Dashboard`, and `Checklist` pages.
- Checklist views pull live OWASP ASVS 5.0 data from the backend, filtered by role, level, application type, developer discipline, primary technology, and optional ASVS categories.
- Selected controls can be exported as JSON or sent to ticketing workflows via the multi-select action bar and modal.
- The dashboard demonstrates quick actions and minimal state, ready for expansion.
- The questionnaire flow captures application context (payments, PII, third parties, etc.), persists responses, and recommends ASVS levels + filter presets that can be applied directly to the checklist.

## Backend overview

- Fastify + Zod for predictable request validation.
- ASVS checklist metadata is sourced from `backend/src/data/asvs-5.0.0-en.json` and flattened through `backend/src/lib/asvsData.ts`.
- Ticketing requests resolve to adapters via `backend/src/ticketing/index.ts`.
- CORS, sensible defaults, and form parsing plugins are pre-configured.

## Extending the project

1. **Adjust ASVS tailoring rules** – Update `backend/src/lib/asvsData.ts` (role/application mappings) and UI messaging as needed.
2. **Introduce a new ticketing adapter** – Implement the `TicketingAdapter` interface and register it within `backend/src/ticketing/index.ts`.
3. **Persist sessions** – Replace the in-memory auth context with a real identity provider and token storage.
4. **Automate Rally linking** – Enhance `ChecklistPage` to fetch Rally work items, pre-populate suggestions, and display statuses.

## SPVS support

- **Pipeline questionnaire** – `/spvs/questionnaire` captures delivery-model context and returns SPVS levels, category focus, and implementation notes. Responses persist per user through `spvsQuestionnaireStore`.
- **Requirements explorer** – `/spvs/requirements` lists Secure Pipeline Verification Standard controls with search, taxonomy filters, and CSV export. Backend data is sourced from `backend/src/data/spvs-1.0.0-en.csv`.
- **API surface** – The backend exposes `/spvs/questionnaire`, `/spvs/questionnaire/questions`, `/spvs/taxonomy`, and `/spvs/requirements` to drive the new UI flows. Reuse these endpoints to integrate SPVS reporting into other tools.

## Testing

### Backend

Vitest covers the SPVS data helpers and questionnaire logic.

```bash
cd backend
npm install
npm run test        # or npm run test:coverage
```

### Frontend

Component tests rely on Vitest + Testing Library; UI smoke tests use Playwright.

```bash
cd frontend
npm install
npm run test            # unit/component suite
npm run test:ui         # assumes the dev server is running locally
```

Set `PLAYWRIGHT_BASE_URL` if your dev server is bound to a different host/port.

## Sample `.env` template

```ini
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
RALLY_CLIENT_ID=replace-me
RALLY_CLIENT_SECRET=replace-me
RALLY_REDIRECT_URI=http://localhost:4000/oauth/rally/callback
MOCK_USER_ID=local-user
MOCK_USER_NAME=Local User
MOCK_USER_EMAIL=local@example.com
MOCK_USER_ROLE=developer
```
