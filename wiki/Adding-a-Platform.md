# Adding a Platform

> Step-by-step guide to adding a new build target to the FED-Shell fleet.

## Before you start

Read these first:
- [Architecture](Architecture.md) — understand the fan-out model
- [Injection-Deep-Dive](Injection-Deep-Dive.md) — understand the single injector
- `ADR.md` ADR-001 (single repo scope) and ADR-004 (parallel jobs)

## Step 1: Does the new target need config injection?

If the target needs to know the URL, app name, or app ID at build time, you
need to add an injection rule.

**Yes** → Go to Step 2.
**No** (e.g. it reads from an env var at runtime) → Skip to Step 3.

## Step 2: Add the injection rule

Open `scripts/inject-config.py` and add a new function following the existing
pattern:

```python
def update_my_platform_config(path, app_name, app_id):
    """Update the [platform] config file with app name and ID."""
    # read, modify, write
    # must be idempotent
    # use only stdlib
```

Then add the call in `main()`:

```python
update_my_platform_config("path/to/config.file", app_name, app_id)
```

Test it:

```bash
python3 scripts/inject-config.py https://test.example.com TestApp com.fed.testapp
# verify the output file
```

## Step 3: Add the CI job

Open `.github/workflows/build-all.yml` and add a new job. It must:

1. Run in parallel (no `needs:` unless it truly depends on another job)
2. Start with checkout + inject:

```yaml
build-my-platform:
  runs-on: [appropriate-runner]
  steps:
    - uses: actions/checkout@v4
    - name: Inject config
      run: python3 scripts/inject-config.py "$TARGET_URL" "$APP_NAME" "$APP_ID"
    - name: Build
      run: |
        # platform-specific build commands
    - uses: actions/upload-artifact@v4
      with:
        name: my-platform-build
        path: path/to/output
```

3. Add the job name to the `package-all` job's `needs:` list.

## Step 4: Make it conditional (if optional)

If the target is optional (like Electron or Tauri), add a `workflow_dispatch`
input and gate the job:

```yaml
build-my-platform:
  if: github.event.inputs.build_my_platform == 'true'
```

And add the input to the `workflow_dispatch` block.

## Step 5: Update documentation

- `README.md` — add the platform to the platform matrix table
- `BUILD.md` — add prerequisites and build commands
- `INSTALL.md` — add how to install the output
- `ROADMAP.md` — move from "Planned" to "Done"
- `CHANGELOG.md` — add an entry under `[Unreleased]`
- `wiki/Architecture.md` — update the diagram and job table

## Step 6: Test

1. Run the injector locally — verify the new config file is correct
2. Trigger the workflow on your fork with a test URL
3. Download the artifact and verify it runs
4. Open a PR with all changes

## Checklist

- [ ] Injection function added and tested (if needed)
- [ ] CI job added, runs in parallel
- [ ] Job added to `package-all` needs
- [ ] README, BUILD, INSTALL, ROADMAP, CHANGELOG updated
- [ ] `python3 -m py_compile` passes
- [ ] Workflow YAML validated
- [ ] No secrets committed
- [ ] PR opened with the template
