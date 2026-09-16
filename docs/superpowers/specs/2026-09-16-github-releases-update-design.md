# GitHub Releases updates

## Goal

Let a user manually update DSH Plugin Sandbox from a verified GitHub Release without overwriting a linked local development checkout.

## Release publication

A GitHub Actions workflow runs on version tags matching `v*`.

1. It installs dependencies and runs the package test suite.
2. It runs `npm pack` to produce the distributable `.tgz` file.
3. It writes a SHA-256 checksum file for that archive.
4. It creates a GitHub Release with the archive and checksum as assets.

The release tag and `package.json` version must match. A mismatch fails before publishing assets.

## Update discovery

The plugin exposes a read-only update-status RPC. It reads the latest GitHub Release from `tommilevs/dsh-plugin-sandbox`, parses the semantic version, and returns one of:

- `up-to-date`
- `update-available`
- `development-link` for `link:`/`file:` installs
- `unavailable` when GitHub cannot be reached or a suitable asset is absent

The UI shows the installed version and status. It checks only when the user clicks **Check for updates**.

## Manual update

When an update is available, the UI offers **Update to vX.Y.Z** and links to the release notes. The update RPC:

1. Downloads the package archive and its checksum from release assets.
2. Validates SHA-256 before unpacking or installing.
3. Copies the current installed package to a timestamped backup inside the DSH profile.
4. Installs the verified archive with the existing profile package-manager rules.
5. Verifies the installed package name and version.
6. Returns a restart-required result.

If download, checksum, installation, or verification fails, the existing profile remains installed. A failure after replacing the package restores the backup.

Linked development installs are never replaced automatically. The UI explains that the checkout is controlled locally and offers no update button.

## Boundaries

- No background polling and no automatic installation.
- No GitHub credential or token is sent by the plugin. Public release assets are fetched anonymously.
- The endpoint accepts only GitHub release asset URLs from the configured repository and HTTPS.
- The mechanism updates only `dsh-plugin-sandbox`; it does not update DSH or unrelated plugins.

## Validation

- Unit tests cover release parsing, version comparison, asset selection, checksum mismatch, link-install protection, successful install, and rollback.
- Workflow tests verify tag/version matching and expected asset names.
- A local mock release server proves the end-to-end update path without publishing a real release.
