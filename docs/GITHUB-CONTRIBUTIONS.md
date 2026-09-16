# GitHub locale contributions

## Contribution shape

A community language contribution contains exactly two files:

```text
locales/<code>.json
locales/metadata/<code>.json
```

The translation file contains only UI translations. The metadata file contains the locale code, native language name, and Unicode flag.

## In-app flow

Use **🌐 Auto → ➕ Add language**. Enter the locale code, native language name, select a flag, and translate the English JSON template. **Install locally** stores the locale immediately. **Submit to GitHub** uses the configured GitHub App gateway or, for local development, the existing authenticated `gh` CLI session.

The plugin never asks contributors for a PAT.

## Locale Guard

`.github/workflows/locale-guard.yml` runs with `pull_request_target`, reads only the PR's file list and file contents through the GitHub API, and does not checkout or execute contributor code. The auto-merge lane is accepted only when exactly one non-English locale translation and its matching metadata file are changed and both pass validation.

When checks pass, the workflow approves the PR and enables squash auto-merge using `GITHUB_TOKEN`. Repository settings must permit Actions to create/approve pull requests and auto-merge must be enabled.

## Reusing an installed locale

Community locale codes are exactly two lowercase ASCII letters. After a contributor installs a locale locally, the Sandbox remembers the translation and metadata and can submit that existing locale to GitHub without requiring the JSON to be pasted a second time.
