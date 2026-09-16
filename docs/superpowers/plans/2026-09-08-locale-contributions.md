# Locale Contributions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a community-friendly locale contribution workflow to DSH Plugin Sandbox: separate locale metadata from translations, allow local installs, prepare GitHub PR contributions, and safely auto-merge locale-only PRs.

**Architecture:** English remains the translation schema/source of truth. Each locale is represented by a translation JSON plus metadata (`code`, `nativeName`, optional flag); UI derives the picker label from metadata. The host plugin validates all locale data before local installation or GitHub submission. GitHub Actions validates that an automatic contribution changes exactly one non-English `locales/*.json` file, then approves and enables squash auto-merge using the repository token.

**Tech Stack:** Node.js ESM, DSH Web client loader, React via DSH, GitHub Actions, GitHub CLI/API, JSON locale files.

**Spec:** `docs/superpowers/specs/2026-09-08-locale-contributions-design.md`

## Global Constraints

- `en.json` is the canonical locale schema.
- Community locale files must contain exactly the English keys and only string values.
- Community auto-merge is restricted to exactly two matching locale files per PR: `locales/<code>.json` and `locales/metadata/<code>.json`.
- Automatic validation must not execute untrusted PR code.
- `🌐 Auto` is a locale-selection mode, not a translation entry describing RU/EN/CH.
- `language.english`, `language.russian`, and `language.auto` are not required in community locale translations.
- Locale metadata is separate from UI translation strings.
- Unicode emoji flags are the primary flag representation; external CDN assets are optional and not required for offline operation.

---

### Task 1: Separate locale metadata from translations

**Files:**
- Create: `locales/metadata/en.json`
- Create: `locales/metadata/ru.json`
- Modify: `lib/i18n.js`
- Test: `test/i18n.test.js`

**Interfaces:**
- Produces `builtInLocaleMetadata`, `getLocaleMetadata(code)` and locale-aware label data consumed by the client.

- [x] **Step 1: Write the failing tests** for metadata lookup and for community locale isolation from language-picker labels.
- [x] **Step 2: Run `npm test` for the i18n tests and confirm the new assertions fail.**
- [x] **Step 3: Implement metadata maps and remove the need for `language.russian` in community translation payloads.**
- [x] **Step 4: Run the i18n tests and confirm they pass.**
- [x] **Step 5: Commit `feat(i18n): separate locale metadata from translations`.**

### Task 2: Extend locale contribution validation and persistence

**Files:**
- Modify: `lib/index.js`
- Modify: `lib/core.js` only if reusable path helpers are required
- Test: `test/locale-contributions.test.js`

**Interfaces:**
- `validateLocalePayload(code, values)` remains the central schema validator.
- `installLocale({ code, name, flag, values })` stores validated locale data and metadata under the plugin locale store.
- `loadCustomLocales()` returns translation tables; `loadCustomLocaleMetadata()` returns metadata.

- [x] **Step 1: Write tests for metadata persistence, invalid codes, missing/extra keys, and a valid German locale.**
- [x] **Step 2: Run the new tests and confirm expected failures.**
- [x] **Step 3: Implement metadata persistence beside locale JSON, without putting metadata into the translation JSON itself.**
- [x] **Step 4: Run locale contribution tests and confirm they pass.**
- [x] **Step 5: Commit `feat(i18n): persist locale metadata separately`.**

### Task 3: Build contribution UX

**Files:**
- Modify: `lib/client.js`
- Test: `test/client-contract.test.js`

**Interfaces:**
- `LanguageSwitcher` shows `🌐 Auto` for automatic mode and native locale labels for selected languages.
- `AddLanguageDialog` collects locale code, native name, flag and English-schema JSON.
- Local install calls RPC `install-locale` with `{ code, name, nativeName, flag, values }`.
- GitHub submission calls RPC `submit-locale` with the same payload.

- [x] **Step 1: Add client-contract tests for metadata-driven labels and the German contribution fields.**
- [x] **Step 2: Run tests and confirm they fail against current implementation.**
- [x] **Step 3: Implement metadata-driven language picker and Add Language form; keep `Auto` as a special mode.**
- [x] **Step 4: Run client-contract tests and confirm they pass.**
- [x] **Step 5: Commit `feat(ui): add metadata-driven locale contribution form`.**

### Task 4: Harden GitHub submission path

**Files:**
- Modify: `lib/index.js`
- Modify: `docs/GITHUB-CONTRIBUTIONS.md`
- Test: `test/github-contributions.test.js`

**Interfaces:**
- `submitLocale(args)` validates first, then uses an explicitly configured Git checkout or GitHub App gateway.
- Local `gh` fallback may create a branch/commit/PR but never pushes arbitrary plugin code.
- Metadata files must be included with the contribution only through the controlled locale contribution path.

- [x] **Step 1: Write tests that reject missing Git checkout, reject malformed metadata, and accept a valid locale payload.**
- [x] **Step 2: Run tests and confirm failures.**
- [x] **Step 3: Implement strict submission validation and contribution naming such as `feat(i18n): add Deutsch locale`.**
- [x] **Step 4: Run the tests and confirm they pass.**
- [x] **Step 5: Commit `feat(github): harden locale contribution submission`.**

### Task 5: Strengthen Locale Guard workflow

**Files:**
- Modify: `.github/workflows/locale-guard.yml`
- Modify: `scripts/validate-locale.mjs`
- Test: `test/locale-guard.test.js`

**Interfaces:**
- Locale Guard accepts exactly one non-English `locales/<code>.json` file per PR.
- Locale metadata is validated as the required companion file `locales/metadata/<code>.json`.
- Workflow performs API-only validation and does not checkout or execute PR code.
- Passing locale-only PRs are auto-approved and queued for squash auto-merge.

- [x] **Step 1: Write a local fixture test for a valid German locale plus metadata, invalid code, extra key, metadata mismatch, changed second file, missing companion, and `en.json` contribution.**
- [x] **Step 2: Run tests and confirm failures for any missing checks.**
- [x] **Step 3: Implement the strict workflow and validator.
- [x] **Step 4: Run workflow fixture tests plus `node scripts/validate-locale.mjs locales/en.json locales/de.json` and confirm success.**
- [x] **Step 5: Commit `ci(i18n): guard locale-only contributions`.**

### Task 6: Documentation and release packaging

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/GITHUB-CONTRIBUTIONS.md`
- Create: `locales/README.md` updates for contributor workflow
- Modify: `package.json` version to `0.4.1`

**Interfaces:**
- Documentation describes `🌐 Auto`, metadata/translation separation, local install, and GitHub submission.

- [x] **Step 1: Add contributor documentation and examples.
- [x] **Step 2: Update package version and release notes.
- [x] **Step 3: Run the full test suite, syntax checks, locale validator, and `npm pack --dry-run`.
- [x] **Step 4: Inspect archive contents and commit `release: dsh-plugin-sandbox 0.4.1`.
