# 🧪 DSH Plugin Sandbox

**Create. Experiment. Test. Snapshot. Compare. Promote.**

A Git-backed disposable laboratory for DeepSeek Harness plugins.

## What 0.2.1 does

- Adds a **Sandbox** action to the DSH sidebar.
- Creates independent sandbox `DSH_HOME` trees under a configurable temporary root.
- Creates a Git repository automatically for every sandbox.
- Never depends on the terminal's current directory for Git operations.
- Installs npm/pnpm/Git/local plugins into the sandbox profile.
- Automatically recovers from pnpm ignored build scripts with `pnpm approve-builds --all` and `pnpm rebuild node-pty`.
- Starts a real child DSH Web runtime for the selected sandbox on an ephemeral port.
- Captures the authenticated DSH URL and lets you open the sandbox UI in a new browser tab.
- Validates dependencies and performs a real sandbox boot smoke test.
- Provides snapshots, Git history, diff, reset and rollback.
- Promotes a validated sandbox into STABLE only after creating a filesystem backup.
- Stops sandbox runtimes automatically when the host plugin is disposed.

## Important safety boundary

**This is not an OS security sandbox.** A plugin installed into a sandbox still executes JavaScript with the permissions of the DSH user account. The sandbox gives you disposable profile state, process separation, Git rollback and a controlled promotion workflow. It does not make an untrusted plugin safe against a malicious process.

For genuinely hostile code, use OS/container/VM isolation.

## Install

From npm/GitHub once published:

```bash
dsh plugin --profile web add dsh-plugin-sandbox
```

Or during development:

```bash
dsh plugin --profile web add /absolute/path/to/dsh-plugin-sandbox
```

Restart the DSH Web profile after installation and refresh the page.

## Typical workflow

1. Open **🧪 Sandbox** inside DSH.
2. Click **+ New Sandbox**.
3. Install a plugin such as `dsh-better-sidebar@latest`.
4. Click **▶ Start Sandbox**.
5. Open the generated authenticated URL in the new tab.
6. Test the plugin in the disposable DSH runtime.
7. Return to the main DSH and use **Validate**, **Snapshot**, **View Diff**, **History**, **Reset** or **Rollback**.
8. Click **🚀 Promote** only when the sandbox passes validation.

The sandbox DSH process runs with `DSH_HOME=<sandbox>/dsh-home`, `cwd=<sandbox>`, `host=127.0.0.1`, and `port=0`.

## Development

```bash
npm test
```

The browser client is delivered as a single DSH `window.__ModuleLoader__.load({ id, factory })` bundle and is intentionally checked in as `lib/client.js`.

## License

MIT
