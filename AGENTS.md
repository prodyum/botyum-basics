# Repository Guidelines

## Project Structure & Module Organization
index.js orchestrates the console assistant, registers the feature packs (`registerCoreAssistant`, `registerVoiceIntegrations`, etc.), and centralises shared CLI utilities. Feature implementations live under `modules/<domain>/`, each export building a group object with `id`, `label`, and `items` consumed by the registrars. Keep shared assets in `documents/` (tracked with `.keep`) and automation helpers under `scripts/` such as `setup.js` for provisioning.

## Build, Test, and Development Commands
- `npm install`: install runtime dependencies declared in `package.json`.
- `npm run setup`: populate `~/.botyum/` workspaces, create `documents/`, and verify optional binaries.
- `npm run setup -- --copy-env`: copy `.env.example` into `.env` when credentials are shared across teammates.
- `npm run dev` / `npm start`: start the interactive menu; watch the console for module logs and health warnings.

## Coding Style & Naming Conventions
The codebase targets Node.js 18+ with ES modules - use `import`/`export` syntax, double quotes, and trailing semicolons. Follow the prevailing two-space indentation, arrow functions for short callbacks, and descriptive factory names like `createCalculationsGroup`. New registrars should be named `register<Domain>` and saved as kebab-case files (`voice-integrations.js`) to align with existing patterns.

## Testing Guidelines
There is no automated test suite yet; exercise features manually via `npm run dev`. When adding a module, smoke-test the new entries end-to-end and confirm `scripts/setup.js` still runs cleanly. Document manual steps and mocked integrations in the PR so reviewers can reproduce the checks.

## Commit & Pull Request Guidelines
Recent history uses short, imperative summaries (e.g., `force adding .env for devs`), so keep commits focused and descriptive. Group related module updates together and mention any new dependencies or binaries in the body. Pull requests should outline the motivation, list touched modules, note manual test results, and link issues or tracking tickets. Include screenshots or CLI transcripts only when they clarify user-facing changes.

## Environment & Configuration Tips
Keep `.env` limited to the credentials your feature actually needs; prefer optional runtime prompts when possible. Reference `.env.example` when introducing new keys and update the README if an external tool (ffmpeg, tesseract, LibreOffice, etc.) becomes mandatory. After changing setup behaviour, rerun `npm run setup` and call out migrations required for existing users.
