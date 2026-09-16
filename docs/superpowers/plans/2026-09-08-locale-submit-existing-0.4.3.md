# Locale Existing Install and Strict Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let locally installed community locales be submitted to GitHub without re-entering JSON, while enforcing exactly two lowercase Latin letters for locale codes.

**Architecture:** Keep locale translation and metadata persisted locally under `locales/`. The browser dialog detects an existing local locale by its two-letter code, preloads its translation and metadata, and submits it by code; the backend may resolve missing values from its local store. The GitHub Locale Guard applies the same two-letter rule independently.

**Tech Stack:** Node.js ESM, React-compatible DSH Web client, JSON locale files, GitHub CLI/Actions.

**Spec:** Existing locale contribution design approved in chat; extend `docs/GITHUB-CONTRIBUTIONS.md` and `locales/README.md`.

## Global Constraints

- Locale code is exactly two lowercase ASCII letters (`^[a-z]{2}$`).
- Built-in locales `en` and `ru` are not community locale submissions.
- Community translation JSON contains exactly the keys from `locales/en.json`.
- Community metadata contains exactly `code`, `nativeName`, and `flag`.
- GitHub auto-merge is allowed only for a translation/metadata pair under `locales/**`.
- No contributor PR code is executed by Locale Guard.

---

### Task 1: Strict locale code validation

**Files:**
- Modify: `lib/index.js`
- Modify: `lib/client.js`
- Modify: `scripts/validate-locale.mjs`
- Test: `test/locale-contributions.test.js`
- Test: `test/locale-guard.test.js`

**Interfaces:**
- `localeCodeValid(code)` and client-side validation must accept only two lowercase ASCII letters.
- Locale Guard validator must reject anything other than `[a-z]{2}`.

- [ ] **Step 1: Write failing tests**

Add assertions that `de`, `ru`, `en` match the shape, while `DE`, `deu`, `de-DE`, `1a`, `a_`, and empty strings do not.

- [ ] **Step 2: Run the focused tests**

Run: `npm test`
Expected: FAIL because the current implementation still allows 2–3 letters and region suffixes.

- [ ] **Step 3: Implement the minimal validation change**

Use exactly:

```js
const LOCALE_CODE_RE = /^[a-z]{2}$/
```

Use it in backend, client, and validator.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/index.js lib/client.js scripts/validate-locale.mjs test/locale-contributions.test.js test/locale-guard.test.js
git commit -m "fix(i18n): restrict locale codes to two letters"
```

### Task 2: Submit an existing local locale without re-entering JSON

**Files:**
- Modify: `lib/index.js`
- Modify: `lib/client.js`
- Test: `test/locale-contributions.test.js`
- Test: `test/client-contract.test.js`

**Interfaces:**
- Backend `submit-locale` accepts `{ code }` and resolves stored values/metadata when `values` are omitted.
- Client `AddLanguageDialog` preloads stored locale values and metadata when the typed two-letter code already exists locally.

- [ ] **Step 1: Write failing tests**

Test that `submitLocale` can read `locales/<code>.json` and `locales/metadata/<code>.json` when `args.values` is absent. Test that client source contains the existing-locale lookup and a distinct submit-existing action label.

- [ ] **Step 2: Run focused tests**

Run: `node --test test/locale-contributions.test.js test/client-contract.test.js`
Expected: FAIL because submit currently requires `args.values` and the dialog has no existing-locale path.

- [ ] **Step 3: Implement backend fallback**

Add a helper that loads a stored locale/metadata pair by code. In `submitLocale`, when `args.values` is omitted, load and validate the pair from `ROOT/locales`.

- [ ] **Step 4: Implement client auto-fill and action state**

When `code` changes to an existing stored locale, load its translation and metadata into the form. Show a compact status such as `✓ Deutsch is installed locally` and change the submit button label to `🚀 Submit Deutsch to GitHub`.

Keep manual JSON editing possible.

- [ ] **Step 5: Run focused tests**

Run: `node --test test/locale-contributions.test.js test/client-contract.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/index.js lib/client.js test/locale-contributions.test.js test/client-contract.test.js
git commit -m "feat(i18n): submit installed locales without re-entry"
```

### Task 3: Update copy and documentation

**Files:**
- Modify: `locales/en.json`
- Modify: `locales/ru.json`
- Modify: `locales/README.md`
- Modify: `docs/GITHUB-CONTRIBUTIONS.md`
- Test: `test/i18n.test.js`

**Interfaces:**
- Existing locale status copy is translated by built-in locales.

- [ ] **Step 1: Add canonical strings**

Add English/Russian keys for:

```text
messages.localeAlreadyInstalled
messages.submitInstalledLocale
```

- [ ] **Step 2: Add translations**

English:

```json
"messages.localeAlreadyInstalled": "This language is already installed locally.",
"messages.submitInstalledLocale": "Submit {name} to GitHub"
```

Russian:

```json
"messages.localeAlreadyInstalled": "Этот язык уже установлен локально.",
"messages.submitInstalledLocale": "Отправить {name} в GitHub"
```

- [ ] **Step 3: Implement interpolation**

Render `{name}` with a simple client helper before display; do not introduce a new dependency.

- [ ] **Step 4: Update documentation**

Document that after local installation, reopening `Add language` with the same two-letter code reuses the local translation and metadata, so contributors do not paste JSON twice.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add locales/en.json locales/ru.json locales/README.md docs/GITHUB-CONTRIBUTIONS.md test/i18n.test.js
 git commit -m "docs(i18n): document local locale resubmission flow"
```

### Task 4: Final verification and release

**Files:**
- Modify: `package.json`
- Test: `test/*.test.js`

- [ ] **Step 1: Bump version to 0.4.3**

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Check syntax**

Run: `node --check lib/index.js && node --check lib/client.js && node --check scripts/validate-locale.mjs`
Expected: PASS.

- [ ] **Step 4: Pack**

Run: `npm pack --dry-run`
Expected: package name/version is `dsh-plugin-sandbox@0.4.3`.

- [ ] **Step 5: Build a clean ZIP**

The archive root must be `dsh-plugin-sandbox-0.4.3/` and must not contain `.git`, generated tarballs, or stale version directories.

- [ ] **Step 6: Final commit**

```bash
git add package.json
git commit -m "release: dsh-plugin-sandbox 0.4.3"
```
