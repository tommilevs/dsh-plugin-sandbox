# DSH Plugin Sandbox 0.2 Design

## Goal

Make DSH Plugin Sandbox independent of the terminal cwd and turn each sandbox into a runnable, Git-backed disposable DSH profile.

## Components

1. **Sandbox store** — registry and path derivation under the sandbox root.
2. **Git service** — init/snapshot/history/diff/reset/rollback using the sandbox root as cwd.
3. **Plugin installer** — runs `dsh plugin --profile web add` with the sandbox DSH_HOME and automatically recovers pnpm build approvals.
4. **Sandbox runtime** — starts a child DSH web process with sandbox DSH_HOME, sandbox cwd, and an ephemeral port; captures the printed authenticated URL; supports stop/status.
5. **Validator** — checks filesystem, package JSON, lockfile, and performs a real boot smoke test in an ephemeral runtime.
6. **Promotion** — validates first, backs up STABLE, then copies sandbox DSH_HOME without node_modules/.git.
7. **Web UI** — create/select/install/start/stop/validate/snapshot/diff/history/reset/rollback/promote/destroy.

## Safety

The sandbox is process-separated but not a security boundary. Installed JavaScript still runs with the permissions of the DSH host account. The UI must label this clearly.

## Compatibility

Use `ctx.webServer.register()` for host API routes and public client slots for UI composition. Package metadata declares the browser entry through `dsh.client` and exports `./client`.

## Failure handling

- Missing Git: clear actionable error.
- Missing STABLE profile: explicit path/configuration error.
- Port collision: runtime uses port 0 by default.
- Child boot failure: capture stderr/stdout tail and clean up the child.
- Invalid sandbox id: reject before filesystem access.
- Promotion failure: preserve the backup and never delete STABLE first.
- Caller cwd: never used as Git cwd for sandbox operations.
