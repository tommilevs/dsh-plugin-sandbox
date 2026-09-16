# 🧪 DSH Plugin Sandbox

[English](README.md) · [Русский](README.ru.md)

**Create · Experiment · Test · Snapshot · Compare · Promote**

**DSH Plugin Sandbox** is a Git-backed environment manager for **DeepSeek Harness (DSH)**. It can be used both as a disposable laboratory for testing plugins and as a way to keep multiple long-lived, independent DSH environments for different kinds of work.

Each sandbox has its own `DSH_HOME`, plugin set, settings and child DSH runtime. Its state is tracked locally with Git, so you can inspect what changed, create snapshots and return to a known-good state if a plugin installation or update goes wrong.

This means a sandbox does not have to be temporary. You can keep separate DSH environments such as:

- **Coding** — development, repository and programming plugins.
- **Video** — tools and integrations used for video production and editing.
- **Music** — a separate DSH with audio and music-oriented plugins.
- **Testing** — an experimental environment for plugins you do not yet want in your main DSH.

The main idea is simple: **separate workloads, keep plugin sets independent, and make every environment reversible through local Git history.**

## Why not just use DSH profiles?

DSH already supports profiles, and DSH Plugin Sandbox does not replace them. The important addition is that every sandbox is treated as a separate Git-controlled DSH environment.

That gives you a practical safety net around plugin changes:

- see exactly what changed with **diff**;
- save known-good states as **snapshots**;
- inspect **Git history**;
- discard uncommitted changes with **Reset**;
- **Rollback** after a broken plugin installation or configuration change;
- keep multiple independent DSH environments without mixing their plugin sets;
- optionally validate and **Promote** a tested environment to `STABLE` when you actually want to update the main DSH.

A specialized sandbox can also remain independent permanently. `Promote` is a workflow option, not the purpose of every sandbox.

## What it can do

- **Create independent DSH environments** with their own `DSH_HOME` and child DSH runtime.
- Keep sandboxes as either **temporary test environments** or **long-lived task-specific DSH installations**.
- Start from a **clean environment** or copy installed plugins and settings from the main DSH profile.
- Install plugins from a **package spec, Git repository, or absolute local path**.
- **Start and stop** each sandbox runtime independently from the main DSH instance.
- Run **validation** before promoting a sandbox.
- Create named **Git snapshots** of sandbox state.
- Inspect **diffs** and **Git history** to understand what changed.
- **Reset** uncommitted changes or **roll back** to an earlier known-good state.
- **Promote** a validated sandbox to `STABLE`; a backup is created before promotion.
- Delete a sandbox when it is no longer needed, together with its local Git history.

## Workflows

### 1. Test a plugin before using it in the main DSH

1. Open **🧪 Sandbox** inside DSH.
2. Create a new sandbox.
3. Choose whether to copy the main DSH plugins/settings or start clean.
4. Install or modify the plugin inside the child DSH runtime.
5. Create snapshots and inspect diffs while testing.
6. If something breaks, use **Reset** or **Rollback** to return to a known-good state.
7. When the result is ready, run validation and use **🚀 Promote** to move it to `STABLE`.
8. Restart the main DSH instance to apply the promoted profile.

### 2. Keep several permanent DSH environments

Create one sandbox per workload and give each one only the plugins it needs. For example, keep `Coding`, `Video` and `Music` as independent environments and start the one appropriate for the current task.

Each environment keeps its own Git history, so installing or updating a plugin in `Video` cannot silently rewrite the known-good state of `Coding`. If an experiment fails, roll back that sandbox without rebuilding the environment from scratch.

There is no requirement to promote these environments to `STABLE`; they can remain separate for as long as they are useful.

## Installation

```bash
dsh plugin --profile web add dsh-plugin-sandbox
```

## Localization

Localization is a convenience feature of the project, not its primary purpose.

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

> **This is a development and state-management sandbox, not an operating-system security sandbox.**

Plugins still execute with the permissions of the DSH user account. DSH Plugin Sandbox provides separate DSH state, process separation, Git-based history and rollback, validation, backups and controlled promotion. Its protection is mainly against unwanted or broken state changes — not malicious code escaping an OS security boundary.

If you need to run genuinely hostile code, use proper OS, container or virtual-machine isolation.

## Repository scope

This repository hosts the public project documentation, locale files, locale validation tooling and GitHub automation used for community translations.

## License

MIT License — see [LICENSE](LICENSE).
