# DSH Plugin Sandbox 0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ship a real runnable Git-backed DSH sandbox with cwd-independent lifecycle management.

**Architecture:** Host services manage sandbox state and child DSH processes; client slots provide the workbench UI. Git and DSH subprocesses always use explicit sandbox paths.

**Tech Stack:** Node.js ESM, DSH WebServer, DSH client slots, Git, pnpm, Node test runner.

**Spec:** docs/superpowers/specs/2026-09-08-dsh-plugin-sandbox-0.2-design.md

## Global Constraints
- Sandbox root defaults to `${TMPDIR}/dsh-safe-test-sandbox`.
- Each sandbox has its own `DSH_HOME` and `.git` repository.
- Runtime commands run with cwd set to the sandbox Git root.
- `node_modules` are never copied into Git snapshots.
- Plugin installation automatically recovers from pnpm ignored-build failures.
- Promotion requires validation and creates a filesystem backup first.
- No claim of OS-level security isolation.

### Task 1: isolate filesystem and Git helpers

**Files:**
- Modify: `lib/index.js`
- Test: `test/core.test.js`

- [ ] Add tests proving Git operations use the supplied sandbox directory even when the process cwd is a non-repository.
- [ ] Add tests for sandbox id validation and path traversal rejection.
- [ ] Split internal path/Git helpers into focused functions without changing public route names.
- [ ] Run `node --test test/core.test.js`.

### Task 2: add sandbox runtime lifecycle

**Files:**
- Modify: `lib/index.js`
- Test: `test/runtime.test.js`

- [ ] Add `start`, `stop`, and runtime status methods.
- [ ] Spawn DSH with `DSH_HOME=<sandbox dsh-home>`, cwd `<sandbox root>`, `web --host 127.0.0.1 --port 0 --no-open`.
- [ ] Parse the authenticated URL from stdout.
- [ ] Kill the child on stop and on plugin disposal.
- [ ] Add timeout and diagnostic tail for failed boot.
- [ ] Run runtime tests with a fake executable so CI does not require a real DSH server.

### Task 3: strengthen validation and promotion

**Files:**
- Modify: `lib/index.js`
- Test: `test/validation.test.js`

- [ ] Validate Git, profile, package JSON, lockfile, and real sandbox boot.
- [ ] Block promotion on any failed check.
- [ ] Preserve the backup if copying fails.
- [ ] Run focused validation tests.

### Task 4: update Web UI

**Files:**
- Modify: `lib/client.js`
- Test: `test/client-contract.test.js`

- [ ] Add Start Sandbox, Stop, Open UI, Validate, Reset, Rollback controls.
- [ ] Show runtime URL/status and explicit non-security-boundary warning.
- [ ] Keep UI on public DSH slots.
- [ ] Run client contract tests and syntax checks.

### Task 5: package and release hygiene

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Create: `.gitignore`

- [ ] Bump version to 0.2.0.
- [ ] Add Node test script.
- [ ] Document installation from npm/GitHub and sandbox runtime workflow.
- [ ] Document that the plugin is process-separated, not an OS security sandbox.
- [ ] Run full test suite and package contents check.
