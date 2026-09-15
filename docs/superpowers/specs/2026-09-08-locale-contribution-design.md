# Locale Contribution Design — DSH Plugin Sandbox 0.4.0

## Goal
Allow users to add community translations without editing plugin code, while making the repository auto-merge lane safe enough for locale-only contributions.

## UX
The language selector contains `🌐 Auto`, built-in English and Russian, community locales, and `➕ Add language`.

The Add Language dialog asks for locale code, display name, and a JSON translation based on `locales/en.json`. The user can either install the locale locally or submit it to GitHub.

## Local install
The server validates the locale against the English key schema and stores the locale under the plugin data root. The browser also stores the locale and display name so the client bundle can use it immediately after reload. Missing translations continue to fall back to English.

## GitHub contribution
The preferred hosted architecture is an optional GitHub App gateway configured with `DSH_PLUGIN_SANDBOX_GITHUB_APP_URL`. The plugin sends only the validated locale payload to that gateway. The gateway is responsible for GitHub App authentication, branch creation and PR creation.

For local development, when the gateway is not configured, the plugin can use an authenticated GitHub CLI session (`gh`) in a configured checkout without asking the user for a PAT.

## Merge guard
`.github/workflows/locale-guard.yml` uses `pull_request_target` without executing PR code. It reads changed files and file contents through the GitHub API, requires exactly one `locales/*.json` file, rejects `locales/en.json`, validates exact keys and string values against the base branch English locale, then approves and enables auto-merge only after validation succeeds.

This workflow must remain isolated from arbitrary PR code. No checkout or execution of the contributor branch is allowed in the guard job.

## Security boundary
The auto-merge lane must never merge a PR that changes JavaScript, workflows, package metadata, or any file outside `locales/*.json`. GitHub repository settings must permit the Actions token to submit approving reviews; auto-merge itself must also be enabled for the repository.

## Extensibility
Community locales are ordinary JSON files under `locales/`. `locales/en.json` is the schema/source-of-truth. New locale files can be added without changing UI logic.
