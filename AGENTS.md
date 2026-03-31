# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router project with source code under `src/`. Route segments live in `src/app` (`home`, `habits`, `reminders`, `login`, `api`, etc.). Reusable UI components live in `src/components`, domain and data helpers in `src/lib`, shared types in `src/types`, and Supabase clients in `src/utils/supabase`. Static assets belong in `public/`, database SQL scripts in `sql/`, and end-to-end tests in `cypress/e2e`.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create a production build and catch type or route issues early.
- `npm run start`: serve the built app locally.
- `npm run lint`: run ESLint with Next core-web-vitals and TypeScript rules.
- `npx cypress open`: launch Cypress interactively for local E2E work.
- `npx cypress run`: execute Cypress specs headlessly.

## Coding Style & Naming Conventions
Use TypeScript for app code and keep `strict`-mode compatibility. Follow the existing pattern of PascalCase for React components (`LoginForm.tsx`, `HabitCard.tsx`), camelCase for functions and variables, and route folders in lowercase. Use the `@/*` path alias for imports from `src/`. No dedicated formatter is configured, so keep changes consistent with surrounding files and run `npm run lint` before submitting.

## Testing Guidelines
E2E coverage is handled with Cypress. Place specs in `cypress/e2e` and name them `*.cy.ts`, following existing examples such as `login.cy.ts` and `register.cy.ts`. Add or update tests when changing authentication, reminders, habits, or other user flows. Prefer assertions around visible behavior over implementation details.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes like `feat:`, `fix:`, and `docs:`. Keep commit subjects short and imperative, for example `fix: handle missing Supabase session`. Pull requests should include a concise summary, note any env or SQL changes, link related issues, and attach screenshots for UI work.

## Security & Configuration Tips
Keep secrets in `.env` only and never commit credentials. When changing auth, email, or Supabase behavior, document required environment variables and any matching SQL migration in `sql/`.
