# Backend (Fastify + TypeScript)

The backend exposes ASVS checklist data and wraps ticketing integrations behind a clean adapter contract. It is intentionally lightweight so you can evolve it toward production needs.

## Scripts

```bash
npm run dev      # Start Fastify with live reload (tsx)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled server
npm run lint     # Lint TypeScript sources
```

## Environment variables

See the project-wide `.env.example` for defaults. At minimum set:

- `RALLY_CLIENT_ID`
- `RALLY_CLIENT_SECRET`
- `RALLY_REDIRECT_URI`
- Optional for local login without OAuth: `MOCK_USER_ID`, `MOCK_USER_NAME`, `MOCK_USER_EMAIL`, `MOCK_USER_ROLE`

## Key directories

- `src/data` – Bundled OWASP ASVS 5.0 JSON (synced from upstream GitHub).
- `src/routes` – Fastify route definitions (checklists, OAuth, ticketing).
- `src/controllers` – Request handlers / orchestration logic.
- `src/ticketing` – Adapter interfaces and Rally implementation.
- `src/lib` – ASVS reference data, filtering rules, and helpers.

## Adding a new ticketing adapter

1. Create a factory in `src/ticketing/adapters/<name>Adapter.ts` that implements `TicketingAdapter`.
2. Register the adapter inside `src/ticketing/index.ts` (or during server boot).
3. Add routes or controllers that invoke the adapter's methods.

This approach keeps OAuth exchange, work-item CRUD, and mapping logic outside of route handlers so they can be replaced without touching HTTP wiring.

## ASVS data model

- Source file: `src/data/asvs-5.0.0-en.json` (synced from OWASP/ASVS GitHub).
- Loader: `src/lib/asvsData.ts` flattens requirements, maps recommended roles, disciplines, technologies, and application types.
- Checklist API (`POST /checklists`) accepts optional `technology` (top languages) and `discipline` filters to narrow the returned controls for specific developer personas.
