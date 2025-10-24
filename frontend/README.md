# Frontend (React + Vite)

This app uses Vite, React, TypeScript, Tailwind, and shadcn/ui to serve role-targeted OWASP ASVS checklists.

## Scripts

```bash
npm run dev      # Start the Vite dev server
npm run build    # Build for production
npm run preview  # Preview the build output
npm run lint     # Lint TypeScript/TSX files
```

## Environment

- `VITE_API_BASE_URL` – API origin (defaults to `http://localhost:4000`).
- Optional: `VITE_MOCK_USER_ID`, `VITE_MOCK_USER_NAME`, `VITE_MOCK_USER_EMAIL`, `VITE_MOCK_USER_ROLE` – allowing the login page to mock a session even when the backend is offline.

## Structure

- `src/pages` – Top-level routes (`Login`, `Dashboard`, `Checklist`).
- `src/components` – shadcn/ui primitives, checklist filter controls, and card components.
- `src/hooks` – Shared hooks, including checklist orchestration (`useChecklist`).
- `src/lib` – Shared utilities, ASVS metadata, API helpers, and developer filter options.
- `src/styles/globals.css` – Tailwind base styles and shadcn tokens.

Extend the UI by generating shadcn components (`npx shadcn-ui add ...`) or by adding new routes under `src/pages` and wiring them into `App.tsx`.

### Checklist experience highlights

- Dynamic filtering by ASVS level, application type, discipline, technology, and specific ASVS categories.
- Multi-select grid cards with ticketing modal for creating/linking work items.
- JSON export for checked controls to track requirements alongside source code.
- Questionnaire-driven recommendations that pre-populate checklist filters.
