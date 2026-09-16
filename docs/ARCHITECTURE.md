# DSH Plugin Sandbox architecture

## Core model

A sandbox is a local Git repository containing an independent `DSH_HOME` and a runnable DSH Web process.

```text
STABLE DSH_HOME
      │
      │ copy (without node_modules/.git)
      ▼
Sandbox Git repo
├── .git/
└── dsh-home/
    └── profiles/web/
          │
          │ DSH_HOME=<sandbox>/dsh-home
          │ cwd=<sandbox root>
          ▼
     child DSH Web runtime
          │
          └── 127.0.0.1:<ephemeral-port>
```

The caller's cwd is irrelevant to Git operations and sandbox runtime startup.

## Host API

`POST /api/dsh-plugin-sandbox`

Methods:

- `status`
- `create`
- `install`
- `start`
- `stop`
- `snapshot`
- `diff`
- `history`
- `validate`
- `reset`
- `rollback`
- `promote`
- `destroy`

## Runtime lifecycle

`start` launches the globally installed DSH executable with:

```text
dsh web --host 127.0.0.1 --port 0 --no-open
```

and sets `DSH_HOME` to the sandbox home while using the sandbox Git root as process cwd. The host captures the authenticated URL printed by DSH and returns it to the client.

The child process is not persisted across host restarts. It is stopped when the user clicks Stop or when the host plugin is disposed.

## Build-script recovery

Plugin installation follows this recovery path:

1. `dsh plugin --profile web add <spec>`
2. if pnpm rejects build scripts: `pnpm approve-builds --all`
3. `pnpm rebuild node-pty`
4. frozen install
5. retry plugin installation
6. Git snapshot

## Validation

Validation checks Git, DSH_HOME, the Web profile, valid `package.json`, the lockfile, a frozen pnpm install and a real DSH sandbox boot.

Promotion is blocked unless every check passes.

## Promotion

Promotion first creates a filesystem backup of STABLE. It then copies the sandbox DSH_HOME into STABLE while excluding `node_modules` and `.git`. Dependencies are reconstructed rather than promoted through Git internals.

If copying the new STABLE state fails, the backup is preserved and the error identifies its location.

## Client composition

The browser half uses public DSH client slots:

- `sidebar.footer.action` for the Sandbox button;
- `shell.overlay` for the workbench overlay.

The package exports `./client` and declares `dsh.client` with `platform: web` and `inject: ["slots"]`.

## Security boundary

This project intentionally does not claim OS-level isolation. A DSH plugin is executable host code. The sandbox provides disposable state, process separation, controlled runtime startup and Git rollback. Host/container/VM isolation remains the correct boundary for hostile code.

## Locale contribution flow

Community locales are stored as `locales/<code>.json` plus `locales/metadata/<code>.json`. The client keeps `Auto` as a special preference and derives locale labels from metadata. The GitHub contribution lane validates exactly that pair, uses API-only inspection under `pull_request_target`, and can auto-approve/auto-merge locale-only PRs.
