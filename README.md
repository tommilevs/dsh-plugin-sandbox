# 🧪 DSH Plugin Sandbox

**Create. Experiment. Test. Snapshot. Compare. Promote.**

A Git-backed disposable laboratory for DeepSeek Harness plugins.

## Locale contributions

The Sandbox supports built-in English and Russian plus community locales. **🌐 Auto** is a special locale-selection mode: it follows the browser environment when a matching locale exists and falls back to English.

Each community locale is two files:

```text
locales/<code>.json
locales/metadata/<code>.json
```

The translation JSON contains only UI strings. Metadata contains the locale code, native language name, and Unicode flag. Contributors can use **🌐 Auto → ➕ Add language** to install a locale locally or submit it to GitHub.

## GitHub automation

Locale-only pull requests are checked by `.github/workflows/locale-guard.yml`. The guard accepts exactly one matching translation/metadata pair, validates the JSON against English, does not execute contributor code, and can automatically approve and enable squash auto-merge after all checks pass.

## Safety boundary

**This is not an OS security sandbox.** Plugins still execute with the permissions of the DSH user account. The sandbox provides disposable profile state, process separation, Git rollback and controlled promotion. For genuinely hostile code, use OS/container/VM isolation.

## Install

```bash
dsh plugin --profile web add dsh-plugin-sandbox
```

## Workflow

1. Open **🧪 Sandbox** inside DSH.
2. Create a sandbox.
3. Install and test a plugin inside the child DSH runtime.
4. Use snapshots, diff, history, reset, rollback and validation.
5. Promote only after validation passes.

## Development

```bash
npm test
```
