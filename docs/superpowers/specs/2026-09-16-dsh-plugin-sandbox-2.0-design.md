# DSH Plugin Sandbox 2.0 Design

## Status

Architecture approved by the project owner. Implementation planning is complete; implementation must follow the design together with the mandatory plan preflight in `docs/superpowers/plans/2026-09-16-sandbox-2.0-plan-preflight.md`.

Sandbox 2.0 changes the project from a one-way `STABLE -> sandbox -> STABLE` testing workflow into a manager for multiple independent, versioned DSH environments. Environments can be temporary test beds or permanent task-specific DSH installations such as Coding, Video, Music, and Testing.

The central design rule is deliberate simplicity: environments are copied and replaced as complete managed states. Sandbox 2.0 does not attempt Git-style merges between DSH environments.

## Goals

1. Treat every managed environment as an independent DSH installation with its own DSH runtime, `DSH_HOME`, plugins, settings, and local Git history.
2. Allow any environment, not only STABLE, to be the source for a new environment.
3. Allow a validated environment to replace any other environment or STABLE without content merging.
4. Allow every managed environment to pin and switch to an exact DSH release, including older and prerelease versions when published by the official DeepSeek Harness repository.
5. Make DSH version changes reversible together with plugin/configuration state.
6. Let the model use Sandbox management tools only when the user explicitly enables AI control.
7. Provide a conservative Safe AI mode and a true YOLO mode with full administrative control over Sandbox without interactive confirmations.
8. Preserve automatic recovery snapshots and transactional recovery as engine guarantees, including in YOLO mode.

## Non-goals

- No Git merge, cherry-pick, or three-way reconciliation between environments.
- No claim of OS, container, VM, or hostile-code isolation.
- No shared writable DSH installation between environments.
- No automatic decision about which DSH version should win when source and target versions differ.
- No attempt to make old plugins compatible with newer DSH versions automatically.
- No silent replacement of the user's globally installed/running STABLE DSH executable.
- No attempt to hide potentially destructive YOLO capabilities behind artificial restrictions after the user explicitly enables YOLO.

## Terminology

- **Manager**: the authoritative Sandbox control plane that owns the registry, operation state, environment lifecycle, and UI/API.
- **Environment**: a managed DSH installation. Existing `sandbox` records migrate to this model.
- **STABLE**: the user's primary DSH environment outside the managed environment directory. It can be a source or replacement target but retains its special role as the main installation.
- **Managed state**: the environment metadata plus the Git-tracked DSH profile/configuration state. Runtime binaries and dependency build outputs are reconstructable and are not committed to Git.
- **Runtime**: the private DSH installation used to launch one managed environment.
- **Recovery point**: an automatically created rollback point before a destructive operation.
- **Replace**: overwrite a target's managed state with a source's managed state while retaining the target identity and target Git repository.
- **Source snapshot**: the immutable source commit/copy captured at the beginning of Clone or Replace and used for the entire operation.

## Environment layout

Each managed environment owns a private runtime. Disk usage is intentionally traded for isolation and reproducibility.

```text
<manager-root>/
├── registry.json
├── downloads/
│   └── <cached official DSH release payloads>
├── recovery/
│   └── <external recovery archives for destructive operations such as delete>
├── operations/
│   └── <transaction journals>
└── environments/
    └── video/
        ├── .git/
        ├── .gitignore
        ├── .sandbox/
        │   └── environment.json
        ├── dsh-home/
        │   └── profiles/web/
        ├── runtime/
        │   └── <private DSH installation>
        └── logs/
```

`runtime/`, dependency build output, logs, and transient files are excluded from the environment Git repository. The Git-tracked `.sandbox/environment.json` records the exact desired DSH release and other reconstructable environment metadata.

A shared `downloads/` directory is only a download/cache optimization. A cached release may be used to materialize several runtimes, but every environment receives a separate runtime tree. The runtime provider must guarantee that modifying one environment's runtime cannot modify another environment's runtime. No environment executes DSH from a shared writable installation.

## Environment identity and registry

The registry remains the manager's index, but the Git-tracked environment manifest is the source of truth for reconstructable environment state.

A conceptual registry record is:

```json
{
  "id": "video",
  "displayName": "Video",
  "path": ".../environments/video",
  "dshHome": ".../environments/video/dsh-home",
  "runtimePath": ".../environments/video/runtime",
  "createdAt": "...",
  "updatedAt": "...",
  "source": {
    "kind": "environment",
    "id": "video-base"
  }
}
```

The Git-tracked manifest contains at minimum:

```json
{
  "schemaVersion": 3,
  "dshRelease": "dsh-v0.1.6-alpha.1"
}
```

The manifest must use an immutable release identity, not `latest`, `next`, or another moving alias.

## DSH release catalog and runtime acquisition

Sandbox 2.0 obtains the selectable version catalog from published, non-draft releases of the official `deepseek-ai/deepseek-harness` repository. Stable and prerelease entries are both allowed and are labelled clearly in the UI.

Release acquisition is handled behind a runtime-provider abstraction. The provider must:

1. resolve an official GitHub release identity to an exact installable DSH version/distribution;
2. download/cache only trusted official artifacts or exact official package versions;
3. materialize a fresh private runtime under the destination environment;
4. run `dsh --version` from that private runtime;
5. reject the runtime unless the reported version matches the selected release identity/version.

The implementation must not silently fall back to the host/global DSH when a private runtime is expected.

If an official release cannot be mapped to an installable runtime for the current platform, the UI marks that release unavailable instead of pretending the environment was switched.

## Create and Clone

Sandbox 2.0 replaces the old STABLE-only creation assumption with explicit source selection.

A new environment can be created from:

- **Clean**: a fresh DSH environment at a selected DSH release;
- **STABLE**: copy the current main DSH profile and use the matching DSH release;
- **Any managed environment**: copy that environment's managed state and exact DSH release.

When cloning a managed environment, Sandbox first creates/records a source snapshot and uses that immutable source commit for the copy. Changes made by the running source environment after the snapshot are intentionally not included in that Clone operation.

Cloning copies managed profile/configuration state but never copies the source `.git` directory. The destination starts a new Git repository with an initial commit such as:

```text
Clone from Video at <source-head>
```

The destination materializes its own private runtime for the source's recorded DSH release. The source and clone therefore share no writable runtime or DSH_HOME state after creation.

For STABLE, which is not necessarily Git-managed by Sandbox, the manager creates a temporary immutable staging snapshot of the selected STABLE profile before copying it.

## Replace instead of Merge

Sandbox 2.0 uses complete replacement, not content merging.

```text
Video-Test --Replace--> Video
Coding-Test --Replace--> Coding
Sandbox-X  --Replace--> STABLE
```

Replace preserves the target identity and target Git repository. It does not copy the source `.git` directory and does not combine source and target commit graphs.

For a managed source, the manager first captures a source snapshot commit. The entire Replace operation reads from that immutable source snapshot, not from a live working tree that may continue changing.

The normal managed-target sequence is:

1. capture the immutable source snapshot;
2. stop the target runtime if it is running;
3. acquire operation locks for source and target;
4. create a target recovery point;
5. verify that source and target DSH releases are aligned;
6. materialize the source managed state from the source snapshot into staging;
7. materialize/reconcile the target's private runtime for the staged release;
8. reconstruct dependencies in the staged target state;
9. run validation and a real boot smoke test;
10. replace the target working state;
11. commit the replacement in the target Git repository;
12. restart only when explicitly requested by the caller/UI.

The source remains unchanged and continues to exist after Replace.

If any step fails, the target is restored to its pre-operation recovery point. An operation journal remains available for diagnosis if automatic recovery itself fails.

## DSH version mismatch gate

Replace is blocked when source and target record different DSH releases.

Example:

```text
Source: Video-Test  dsh-v0.1.5
Target: Video       dsh-v0.1.6
```

For two managed environments, the manager presents exactly these resolution paths:

1. **Change target to the source release**, validate it, then continue Replace.
2. **Change source to the target release**, validate/test the source, then retry Replace later.
3. **Cancel**.

The manager never auto-selects a winner and never merges across a version mismatch.

In Safe AI mode, either version-changing path requires human approval. In YOLO mode, the model may choose and execute either path without confirmation.

### STABLE target exception

STABLE is special because Sandbox 2.0 does not silently take ownership of or overwrite the globally installed/running host DSH executable.

If Replace targets STABLE and the source DSH release differs from the currently running STABLE release, Sandbox 2.0 offers:

1. **Change the source to the STABLE release**, validate/test the source, then retry Replace.
2. **Cancel**.

Changing the host/global STABLE DSH executable itself remains outside the first Sandbox 2.0 implementation. A future explicit "manager-owned STABLE runtime" mode may make STABLE fully symmetric with managed environments, but it is not required for 2.0.

This exception applies only to the executable/runtime version. Replace may still update STABLE's managed Web profile after version alignment and validation.

## Switching a managed environment's DSH release

Changing DSH version is a transactional operation over the whole managed environment, not a pointer edit.

For `Legacy-Music: 0.1.3 -> 0.1.4`:

1. stop the environment;
2. create a recovery point that records the current Git HEAD and runtime release;
3. ensure the selected official release is obtainable;
4. materialize a new private runtime in staging;
5. update the Git-tracked environment manifest to the selected release;
6. reconstruct profile dependencies against the new runtime;
7. run validation and a real boot smoke test;
8. commit the version switch only after successful validation;
9. activate the new private runtime.

On failure, both managed state and runtime release are restored to the recovery point.

## Git snapshots, Reset, and Rollback across DSH versions

Git stores the desired DSH release in `.sandbox/environment.json` together with the managed profile state. Runtime binaries are never committed.

Reset/Rollback therefore has two phases:

1. restore the selected Git state;
2. reconcile the private runtime and dependency tree to the `dshRelease` recorded by that Git state.

If Git history moves from a commit using DSH 0.1.6 to one using DSH 0.1.3, Sandbox must rematerialize the 0.1.3 private runtime and reconstruct dependencies before declaring Reset/Rollback complete.

Destructive Reset/Rollback itself creates a recovery point before changing the current state.

## Recovery and operation journal

Automatic recovery is an engine guarantee, not an AI permission boundary.

Before destructive operations, Sandbox creates a recovery point. This includes at least:

- Replace;
- DSH release switch;
- destructive Reset/Rollback;
- STABLE profile replacement;
- Delete.

For normal managed environments, Git snapshots cover tracked state. Operations that can remove the environment itself, especially Delete, additionally write an external recovery archive under the manager's `recovery/` directory.

Long-running destructive operations have a transaction journal under `operations/`. On manager startup, incomplete operations are detected and surfaced for recovery rather than silently ignored.

Recovery records are ordinary Sandbox-managed data. In YOLO mode the model may delete them if the management API exposes cleanup/deletion and the user has granted full control.

## Control plane and child environment bridge

Sandbox 2.0 has one authoritative manager for registry mutation and destructive lifecycle operations. Child DSH runtimes do not independently edit the shared registry.

When the manager starts a child environment, it injects manager-bridge information such as:

```text
DSH_PLUGIN_SANDBOX_ENV_ID=<environment-id>
DSH_PLUGIN_SANDBOX_MANAGER_URL=<loopback-manager-endpoint>
DSH_PLUGIN_SANDBOX_MANAGER_TOKEN=<ephemeral scoped token>
```

The Sandbox plugin inside the child can use this bridge for its UI and model tools. This is what allows a model working inside `Video` to ask the manager to clone `Video`, inspect `Music`, or replace another environment.

The manager endpoint is loopback-only and tokens are short-lived/scoped to the launched child session. These controls reduce accidental exposure but do not turn an untrusted DSH plugin into a security boundary; plugins in the same user account/process context remain executable code.

If the authoritative manager is unavailable, child management actions fail closed with a clear message. The child DSH itself may continue running.

## AI control modes

AI control is explicit and disabled by default.

The manager exposes one global mutually exclusive mode:

```text
Off
Safe
YOLO - Full AI Control
```

The AI-control mode itself is a human-owned permission setting. Model tools cannot switch `Off -> Safe`, `Safe -> YOLO`, or otherwise raise their own Sandbox authority. Enabling YOLO requires an explicit human action in the Sandbox UI/authorized human API.

### Off

- Sandbox management tools are not registered for the model.
- Human UI/API operation remains available.

### Safe

Safe mode is intentionally conservative.

The model may autonomously perform read-only inspection such as:

- list environments;
- inspect DSH releases and runtime state;
- inspect plugin summaries;
- inspect Git history and diff;
- inspect available official DSH releases;
- inspect validation/recovery/operation status.

Pure metadata/read operations return immediately.

Any action that mutates environment state, executes package/plugin code, changes a runtime, or may discard data becomes a pending action requiring explicit human approval. This includes at least:

- create/clone;
- install/remove/update plugin;
- start runtime when doing so executes environment plugins;
- validation when it includes a real boot;
- Reset/Rollback;
- DSH release switch;
- Replace;
- STABLE modification;
- Delete;
- recovery cleanup.

The model can prepare and explain a pending action, but the authoritative manager executes it only after approval from the UI.

### YOLO - Full AI Control

YOLO gives the model full administrative access to all capabilities exposed by DSH Plugin Sandbox and to all managed environments, including STABLE profile operations, without interactive confirmation.

In YOLO the model may, without asking the user again:

- create and clone environments;
- inspect and modify any environment;
- install, remove, and update plugins;
- start and stop runtimes;
- switch any managed environment to another supported DSH release;
- Reset and Rollback;
- Replace any managed environment from any other environment;
- replace/update the STABLE Web profile after version alignment;
- delete environments;
- clean recovery/history data when such API is exposed;
- perform any future Sandbox administration operation unless that operation is explicitly outside the Sandbox API.

YOLO does not grant operating-system `root`/Administrator privileges by itself. It grants full control over Sandbox capabilities, which still run with the permissions of the DSH user account.

The UI must display a strong warning before enabling YOLO. Enabling it requires an explicit human confirmation action. After it is enabled, Sandbox does not insert per-operation approval dialogs for model-initiated actions.

Mandatory recovery snapshots, validation rules, version checks, and transaction journals still run in YOLO because they are correctness properties of the engine, not user confirmation barriers.

## Model tool surface

Model access uses native DSH tool registration (`harness.defineTool` / `harness.registerTool`) and a thin bridge to the authoritative manager. The model is not expected to shell out to `dsh` or mutate registry files directly.

The exact tool names may change during implementation, but the conceptual surface includes:

```text
sandbox_list
sandbox_inspect
sandbox_history
sandbox_diff
sandbox_releases
sandbox_create
sandbox_clone
sandbox_snapshot
sandbox_install_plugin
sandbox_start
sandbox_stop
sandbox_validate
sandbox_change_dsh_release
sandbox_reset
sandbox_rollback
sandbox_replace
sandbox_delete
sandbox_recovery_list
sandbox_recovery_restore
sandbox_recovery_delete
```

Every mutating tool goes through one policy gate in the authoritative manager. UI hiding alone is never considered permission enforcement.

The Sandbox AI-control setting governs only Sandbox-provided model tools. It does not revoke unrelated shell, file, computer-use, or other capabilities that the surrounding DSH configuration may separately give the model.

## Human UI

The workbench changes from a STABLE-centric sandbox list to an environment manager.

Each environment card should show at minimum:

- name/id;
- DSH release;
- running/stopped/error state;
- plugin summary;
- Git HEAD/dirty state;
- source/creation origin when known;
- validation status when available.

Primary actions include:

- New Environment;
- Clone;
- Change DSH Version;
- Start/Stop;
- Install Plugin;
- Snapshot;
- Diff;
- History;
- Reset/Rollback;
- Validate;
- Replace Target From This Environment;
- Delete.

Replace uses explicit Source and Target selectors and always previews both DSH releases before execution.

AI Control is shown as `Off / Safe / YOLO`. YOLO uses a warning style and an explicit human confirmation dialog describing its scope.

## API evolution

The existing host API is retained conceptually but becomes environment-oriented.

Existing operations such as `status`, `install`, `start`, `stop`, `snapshot`, `diff`, `history`, `validate`, `reset`, `rollback`, and `destroy` continue with environment IDs.

`create` gains explicit source and DSH-release selection.

The old STABLE-only `promote` path becomes a compatibility wrapper around generalized Replace with STABLE as target. New callers use generalized operations such as:

```text
clone
replace
listReleases
changeDshRelease
recoveryList
recoveryRestore
recoveryDelete
aiControlGet
aiControlSet
pendingActionList
pendingActionApprove
pendingActionDeny
```

`aiControlSet` is available only to an authorized human control path, never as a model tool.

The API must reject source == target for Replace and must reject concurrent destructive operations on the same environment.

## Locking and concurrency

Multiple DSH environments may run simultaneously. Registry and destructive operation state therefore cannot rely on unsynchronized read-modify-write JSON access from several child processes.

Only the authoritative manager mutates the registry. It owns in-process state and persists registry updates atomically.

Destructive operations acquire environment locks. Multi-environment operations such as Replace acquire locks in deterministic ID order to prevent deadlocks.

The manager rejects or queues a second destructive operation touching an already locked environment.

A source snapshot is captured before the operation uses source state, so a running source may continue operating after the snapshot without changing the Clone/Replace input.

## Validation

Validation remains a real operational check and expands to include:

1. environment Git repository integrity;
2. environment manifest/schema validity;
3. selected DSH release availability;
4. private runtime exists and reports the expected exact version;
5. DSH_HOME and Web profile exist;
6. profile `package.json` is valid;
7. lockfile/workspace state is valid;
8. frozen dependency reconstruction succeeds;
9. a real DSH Web boot succeeds from the environment's private runtime.

Replace and DSH release switching cannot complete successfully unless validation passes.

## Migration from 0.5.x

Existing sandboxes are imported as environments.

For each existing record:

1. preserve its current Git repository and DSH_HOME;
2. derive the recorded DSH version from the existing `runtimeSpec.version`;
3. create `.sandbox/environment.json` and commit the migration;
4. materialize a private runtime for that exact release/version;
5. update the registry to the new environment schema only after validation succeeds.

Migration does not delete the old registry until the new registry has been written successfully. If a runtime version cannot be materialized automatically, the environment is marked `migration-required` and remains untouched for manual resolution.

The existing `promote` button can remain temporarily as an alias for `Replace -> STABLE` to avoid breaking user habits.

## Failure handling

- **Release catalog unavailable**: existing environments remain runnable; version switching is disabled until the catalog is available or the desired runtime is already cached/materialized.
- **Runtime materialization fails**: leave the current runtime/state active; do not commit the version switch.
- **Dependency reconstruction fails**: restore the pre-operation recovery point.
- **Boot validation fails**: restore the pre-operation recovery point.
- **Replace fails before activation**: target remains unchanged.
- **Replace fails after activation**: automatically restore the target recovery point; preserve journal/logs if recovery fails.
- **Manager crashes mid-operation**: startup detects the incomplete journal and offers/attempts deterministic recovery.
- **Manager unavailable to a child**: management tools fail closed; the child runtime itself is not force-killed solely because the manager disappeared.
- **Version mismatch during managed-to-managed Replace**: stop before copying target state and require one of the explicit alignment paths.
- **Version mismatch during Replace to STABLE**: source must be aligned to STABLE or the operation is cancelled in Sandbox 2.0.
- **YOLO action fails**: return the real operation error to the model and preserve recovery/journal data; do not fabricate success.

## Security boundary

Sandbox 2.0 improves state isolation and reproducibility, not hostile-code containment.

A plugin installation may execute package scripts and a running plugin executes with the DSH user's OS permissions. Separate `DSH_HOME`, private runtimes, Git history, recovery snapshots, and process separation do not replace a container/VM/OS sandbox.

Safe/YOLO controls govern what the model may ask the Sandbox manager to do. They are not a defense against a malicious plugin already executing arbitrary host code with the user's permissions, and they do not restrict other non-Sandbox tools separately granted to the model by DSH.

## Testing strategy

Implementation must add automated coverage for at least:

- environment schema migration from 0.5.x;
- clone from STABLE, clean, and another environment;
- Clone uses an immutable source snapshot;
- clone receives a distinct runtime path and distinct DSH_HOME;
- same DSH release in two environments never resolves to the same writable runtime path;
- release catalog parsing including prereleases;
- exact runtime version verification;
- successful DSH release upgrade and downgrade;
- failed version switch restores previous state/version;
- Git Reset/Rollback across DSH versions rematerializes the recorded runtime and dependencies;
- Replace uses an immutable source snapshot;
- Replace never copies `.git` and preserves target history/identity;
- managed-to-managed Replace version mismatch is blocked;
- Replace-to-STABLE version mismatch requires source alignment;
- Replace failure restores target;
- concurrent destructive operation locking;
- recovery archive creation/restoration for Delete;
- Off mode exposes no model management tools;
- Safe mode routes mutating/code-executing actions to pending approval;
- YOLO executes the same actions without approval;
- YOLO can target any managed environment and STABLE profile operations allowed by the API;
- model tools cannot enable YOLO or elevate AI-control mode;
- engine recovery snapshots still occur in YOLO;
- child bridge calls are rejected with invalid/expired tokens;
- manager-unavailable child behavior fails closed;
- existing human UI workflows remain usable without enabling AI control.

## Delivery strategy

Because this is a major architectural change, implementation should be split into reviewable stages while keeping the final model coherent:

1. environment schema + private runtime provider + migration;
2. generalized Create/Clone and managed-environment version switching;
3. generalized Replace + recovery journal + STABLE compatibility path;
4. environment-manager UI;
5. authoritative manager bridge for child environments;
6. Off/Safe/YOLO model tools and approval queue;
7. compatibility cleanup, documentation, and release qualification.

Each stage must preserve tests for the existing 0.5.x behavior that remains supported until its replacement is complete.
