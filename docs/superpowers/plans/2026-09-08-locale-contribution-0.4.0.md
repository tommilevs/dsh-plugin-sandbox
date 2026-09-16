# Implementation Plan — Locale Contribution Flow

1. Add `locales/en.json`, `locales/ru.json`, and contribution guidance.
2. Add server-side locale validation, local persistence, status exposure, and optional GitHub App gateway/CLI submission.
3. Add the Add Language dialog, JSON editor, local install action, and GitHub submission action to the web client.
4. Add the Locale Guard workflow with API-only PR inspection and restricted auto-approve/auto-merge.
5. Add regression tests for schema validation, client contribution controls, and workflow restrictions.
6. Run the full Node test suite, syntax checks, locale validation, and `npm pack --dry-run`.
7. Publish the source tree to the GitHub repository and retain a ZIP/npm artifact for local installation.
