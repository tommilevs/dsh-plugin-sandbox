# 🧪 DSH Plugin Sandbox

**Create. Experiment. Test. Snapshot. Compare. Promote.**

A Git-backed disposable laboratory for DeepSeek Harness plugins.

## What 0.4.4 does

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
3. Install a plugin such as:

```text
dsh-better-sidebar@latest
```

4. Click **▶ Start Sandbox**.
5. Open the generated authenticated URL in the new tab.
6. Test the plugin in the disposable DSH runtime.
7. Return to the main DSH and use **Validate**, **Snapshot**, **View Diff**, **History**, **Reset** or **Rollback**.
8. Click **🚀 Promote** only when the sandbox passes validation.

The sandbox DSH process runs with:

```text
DSH_HOME=<sandbox>/dsh-home
cwd=<sandbox>/.git root
host=127.0.0.1
port=0
```

Using `port=0` means the sandbox does not fight with the main `3080`/`3081` DSH instances.

## Local plugin development

When installing a local plugin from the UI, provide an absolute path. The host resolves that path explicitly before changing into the sandbox profile directory, so a local plugin does not accidentally become relative to the DSH profile.

The host-side Git commands always use the sandbox root as their `cwd`. This specifically fixes the earlier failure mode:

```text
fatal: not a git repository
```

## Storage

Default:

```text
${TMPDIR}/dsh-safe-test-sandbox/
```

Override:

```bash
export DSH_PLUGIN_SANDBOX_ROOT=/custom/path
```

Optional explicit STABLE profile path:

```bash
export DSH_PLUGIN_SANDBOX_STABLE_HOME=/root/dsh-env/home
```

Each sandbox is shaped like:

```text
sandbox-id/
├── .git/
└── dsh-home/
    └── profiles/
        └── web/
```

`node_modules` are intentionally excluded from Git snapshots and reconstructed by pnpm.

## Requirements

- DeepSeek Harness with the current WebServer and client slot APIs.
- Node.js compatible with the DSH installation.
- Git available on `PATH`.
- pnpm for plugin installation.

Windows is supported by the host code path through `git.exe`, `npm.cmd`, `pnpm.cmd` and Windows-safe child process handling. The current release still treats Linux as the primary tested environment.

## Localization (i18n / l10n)

The Web client ships with **English (`en`)** and **Russian (`ru`)** translations. **🌐 Auto** detects the browser language and uses a matching locale when available, otherwise it falls back to English.

Community languages are data-driven: translation strings live in `locales/<code>.json`, while language identity lives in `locales/metadata/<code>.json` (`code`, `nativeName`, `flag`). Community locale codes are exactly two lowercase Latin letters, such as `de`, `fr` or `zh`.

Legacy installed locales are migrated forward when their schema is missing newer English keys. Migration adds the missing keys as English fallback values, marks those keys as untranslated, and only allows GitHub submission after they have been translated.

Use **➕ Add language** to create a locale, install it locally, and later submit the same saved locale to GitHub without re-pasting the JSON. If a locale is already installed locally, the UI offers an update path instead of creating a duplicate. When the local locale matches `main`, the GitHub action reports it as already published and creates no empty PR. If it differs from `main`, the contribution becomes an update PR.

## Language picker interaction

The language picker keeps the Add Language action outside the native `<select>` lifecycle so opening the dialog does not close the Sandbox overlay. The add action also stops pointer/click propagation and is deferred until the native selection event has settled.

## Development

```bash
npm test
```

The test suite covers:

- sandbox path/id safety;
- explicit local plugin path resolution;
- runtime URL parsing and process termination;
- client slot/control contract.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## License

MIT


## Community languages

Use **🌐 Language → ➕ Add language** to open the built-in English JSON template. Validate the translated JSON, then either install it locally or submit it to GitHub. Community locale files live under `locales/` and must preserve the key set from `locales/en.json`.

For hosted GitHub contributions, set `DSH_PLUGIN_SANDBOX_GITHUB_APP_URL` to a small GitHub App gateway. For local development, an authenticated `gh` CLI session can be used as a no-PAT fallback. See `docs/GITHUB-CONTRIBUTIONS.md`.

## Locale contributions

The UI supports built-in English and Russian plus community locales. **🌐 Auto** selects a supported locale from the browser environment and falls back to English. Language identity is stored separately from translations as metadata (`code`, `nativeName`, `flag`). Use **➕ Add language** to install a locale locally or submit it to GitHub. Community auto-merge accepts only the translation/metadata pair and runs the Locale Guard without executing contributor code.
