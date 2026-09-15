# DSH Plugin Sandbox Locale Contributions Design

## Goal

Allow Sandbox users to add custom UI languages locally and submit them to the public repository through a tightly constrained GitHub contribution path.

## Decisions

### Locale data

Each locale is stored as two files:

```text
locales/<code>.json
locales/metadata/<code>.json
```

The translation file contains UI strings only. It must contain exactly the same keys as `locales/en.json` and all values must be strings.

The metadata file contains only locale identity/display data:

```json
{
  "code": "de",
  "nativeName": "Deutsch",
  "flag": "🇩🇪"
}
```

`Auto` is a special UI mode and is not part of any locale translation file.

### Local mode

The Add Language dialog accepts a locale code, native language name, a Unicode emoji flag and translated JSON. The server validates the locale and stores both files in its local locale store. The client merges local custom locales with built-in English and Russian translations.

### GitHub contribution mode

The Add Language dialog can submit the same validated locale to GitHub. Submission creates a branch and a pull request containing exactly two new files: the locale translation and its metadata. The normal contribution path never accepts arbitrary code edits.

A configured GitHub App gateway may handle authenticated PR creation. A local development fallback uses the user's existing `gh` authentication and an explicitly configured checkout; the UI never asks for a PAT.

### Auto approval

A repository GitHub Action runs on `pull_request_target` and uses only GitHub API/CLI calls against the PR contents. It never checks out or executes contributor code.

The Locale Guard accepts only a PR with exactly these two files:

```text
locales/<code>.json
locales/metadata/<code>.json
```

Both files must use the same locale code, `en.json` cannot be used as a community translation, the translation keys must exactly match English, metadata must validate, and no other files may change.

Only after all checks pass does the workflow approve the PR and request squash auto-merge.

### Flags

Unicode emoji flags are the default representation. The contribution format does not require a network request for flags. External CDN-backed flag artwork can be added later as optional presentation, without making locale selection dependent on network access.

## Security boundary

This workflow automates trusted, narrowly scoped locale contributions. It does not make arbitrary pull requests safe. No contributor-controlled JavaScript is executed by Locale Guard, and only locale data is eligible for automatic approval and merge.
