# GitHub Releases Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish verified package releases and let users manually update DSH Plugin Sandbox from GitHub Releases.

**Architecture:** A focused `lib/releases.js` module owns GitHub API parsing, semantic-version comparison, asset validation, checksum verification, and profile replacement. `lib/index.js` exposes read-only status and explicit update RPCs, while the client renders the update controls. Two workflows publish tag releases and weekly locale-only patch releases.

**Tech Stack:** Node.js ESM, built-in `crypto`, `https`, `fs`, pnpm/npm package installation, GitHub Actions, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-16-github-releases-update-design.md`

## Global Constraints

- Release assets are public HTTPS assets from `tommilevs/dsh-plugin-sandbox` only.
- Check updates only after an explicit UI action; never auto-install.
- Never replace `link:` or `file:` development installations.
- Verify SHA-256 before installation and restore the previous package if replacement fails.
- Weekly workflow runs Sunday 09:00 UTC and only releases locale-only JSON changes.

---

### Task 1: Release metadata primitives

**Files:**
- Create: `lib/releases.js`
- Create: `test/releases.test.js`

**Interfaces:**
- Produces `compareVersions(a, b)`, `parseRelease(payload)`, `selectAssets(release)`, `verifyChecksum(buffer, text)`.

- [ ] **Step 1: Write failing tests**

```js
test('selectAssets accepts matching package and checksum assets from this repository', () => {
  const assets = selectAssets({ tag_name: 'v0.5.1', assets: [
    { name: 'dsh-plugin-sandbox-0.5.1.tgz', browser_download_url: 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/download/v0.5.1/dsh-plugin-sandbox-0.5.1.tgz' },
    { name: 'dsh-plugin-sandbox-0.5.1.tgz.sha256', browser_download_url: 'https://github.com/tommilevs/dsh-plugin-sandbox/releases/download/v0.5.1/dsh-plugin-sandbox-0.5.1.tgz.sha256' },
  ] })
  assert.equal(assets.version, '0.5.1')
})
```

- [ ] **Step 2: Run `node --test test/releases.test.js`; expect failure.**
- [ ] **Step 3: Implement strict semver, URL, tag and checksum parsing in `lib/releases.js`.**
- [ ] **Step 4: Add checksum mismatch and prerelease tests, then run the focused tests; expect pass.**
- [ ] **Step 5: Commit `feat: add verified release metadata parsing`.**

### Task 2: Profile update transaction

**Files:**
- Modify: `lib/profile.js`
- Modify: `lib/releases.js`
- Modify: `test/profile.test.js`
- Modify: `test/releases.test.js`

**Interfaces:**
- Produces `updatePluginProfile({ profile, archive, version, install })` returning `{ version, backupPath }`.

- [ ] **Step 1: Write failing tests for link-install refusal, checksum-before-install, successful backup/install, and rollback after install failure.**
- [ ] **Step 2: Run the focused tests; expect failure.**
- [ ] **Step 3: Implement a timestamped profile backup, archive install through the existing package-manager policy, package-name/version verification, and restoration on error.**
- [ ] **Step 4: Run `node --test test/profile.test.js test/releases.test.js`; expect pass.**
- [ ] **Step 5: Commit `feat: add rollback-safe release installation`.**

### Task 3: Host RPC and update UI

**Files:**
- Modify: `lib/index.js`
- Modify: `lib/client.js`
- Modify: `locales/en.json`
- Modify: `locales/ru.json`
- Modify: `test/client-contract.test.js`
- Modify: `test/locale-contributions.test.js`

**Interfaces:**
- Adds RPC methods `release-status` and `update-release`.
- Adds a UI section with current version, `Check for updates`, release notes link, and `Update to vX.Y.Z`.

- [ ] **Step 1: Write failing client and RPC contract tests for development-link status, unavailable status, update-ready status, and restart-required success.**
- [ ] **Step 2: Run focused tests; expect failure.**
- [ ] **Step 3: Wire explicit user-triggered status fetch and update RPC; show errors without exposing URLs containing credentials.**
- [ ] **Step 4: Add English/Russian strings and schema assertions.**
- [ ] **Step 5: Run `node --test test/client-contract.test.js test/locale-contributions.test.js`; expect pass.**
- [ ] **Step 6: Commit `feat: add manual GitHub Releases update controls`.**

### Task 4: Release workflows

**Files:**
- Create: `.github/workflows/release.yml`
- Create: `.github/workflows/weekly-locale-release.yml`
- Create: `test/release-workflows.test.js`
- Modify: `README.md`

- [ ] **Step 1: Write failing workflow text tests for tag/version equality, `npm pack`, SHA-256 assets, and Sunday `09:00 UTC` schedule.**
- [ ] **Step 2: Run `node --test test/release-workflows.test.js`; expect failure.**
- [ ] **Step 3: Implement tag workflow and scheduled locale-only patch workflow, with explicit no-release Actions summaries.**
- [ ] **Step 4: Document publishing, manual updates, development-link behaviour, and weekly locale releases.**
- [ ] **Step 5: Run focused workflow tests; expect pass.**
- [ ] **Step 6: Commit `ci: publish verified GitHub Releases`.**

### Task 5: End-to-end verification and release preparation

**Files:**
- Modify: `README.md`
- Modify: `outputs/diagnostics.md`

- [ ] **Step 1: Add a local mock-release-server test proving discovery, SHA-256 verification, update, and restart-required response.**
- [ ] **Step 2: Run the entire suite:**

```bash
node --test test/*.test.js
node scripts/validate-locale.mjs locales/en.json locales/ru.json
git diff --check
```

- [ ] **Step 3: Package the source with `npm pack --dry-run`, inspect that workflows and documentation are included, and record results in diagnostics.**
- [ ] **Step 4: Commit `test: verify release update flow end to end`.**
