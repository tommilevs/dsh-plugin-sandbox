# 🧪 DSH Plugin Sandbox

[English](README.md) · [Русский](README.ru.md)

**Create · Experiment · Test · Snapshot · Compare · Promote**

**DSH Plugin Sandbox** is a disposable, Git-backed development laboratory for **DeepSeek Harness (DSH)** plugins. It lets you experiment with plugins in a separate DSH environment, inspect every change, roll back when needed, and promote a tested sandbox to your stable profile only after validation.

The goal is simple: make plugin development and testing safer, repeatable, and easy to undo without turning your main DSH profile into the test environment.

## What it can do

- **Create isolated sandboxes** with their own `DSH_HOME` and child DSH runtime.
- Start from a **clean environment** or copy installed plugins and settings from the main DSH profile.
- Install plugins from a **package spec, Git repository, or absolute local path**.
- **Start and stop** the sandbox runtime independently from the main DSH instance.
- Run **validation** before a sandbox is promoted.
- Create named **Git snapshots** of sandbox state.
- Inspect **diffs** and **Git history** to understand what changed.
- **Reset** uncommitted changes or **roll back** to an earlier snapshot.
- **Promote** a validated sandbox to `STABLE`; a backup is created before promotion.
- Keep the main profile untouched until you deliberately accept the tested result.

## Typical workflow

1. Open **🧪 Sandbox** inside DSH.
2. Create a new sandbox.
3. Choose whether to clone the main DSH plugins/settings or start clean.
4. Install or modify a plugin and run it inside the child DSH runtime.
5. Snapshot useful states, compare changes, validate, reset, or roll back as needed.
6. When the result is ready, use **🚀 Promote** to move the validated sandbox to `STABLE`.
7. Restart the main DSH instance to apply the promoted profile.

## Installation

```bash
dsh plugin --profile web add dsh-plugin-sandbox
```

## Localization

The Sandbox has built-in **English** and **Russian** localization and supports community languages. The repository currently also contains a **German** community locale.

`🌐 Auto` follows the browser language when a matching locale is available and falls back to English otherwise.

A locale consists of UI strings and metadata:

```text
locales/<code>.json
locales/metadata/<code>.json
```

The UI can help contributors install a translation locally and prepare a GitHub contribution. It also tracks translation progress and highlights strings that still need translation when the English schema changes.

### Contributing a locale

For a new language, add both the translation and matching metadata file. Existing community translations may update only `locales/<code>.json` when their metadata has not changed.

You can validate a locale locally with:

```bash
node scripts/validate-locale.mjs \
  locales/en.json \
  locales/de.json \
  locales/metadata/de.json
```

Community locale pull requests are checked by **Locale Guard**. The workflow accepts one translation file plus an optional matching metadata file, validates the candidate against the canonical English schema, and does not execute code from the pull request. The English source locale does not use the community auto-merge path. Valid community locale PRs can be automatically approved and squash-merged after the checks pass.

## Safety boundary

> **This is a development sandbox, not an operating-system security sandbox.**

Plugins still execute with the permissions of the DSH user account. DSH Plugin Sandbox provides disposable profile state, process separation, Git-based history/rollback, validation, backups, and controlled promotion. If you need to run genuinely hostile code, use proper OS, container, or virtual-machine isolation.

## Repository scope

This repository hosts the public project documentation, locale files, locale validation tooling, and GitHub automation used for community translations.

## License

MIT License — see [LICENSE](LICENSE).
