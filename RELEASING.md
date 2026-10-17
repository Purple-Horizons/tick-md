# Releasing

Three npm packages live in this repo:

| Package | Path | Notes |
|---|---|---|
| `@gianni-dalerta/tick-core` | `packages/tick-core` | Parser, serializer, types, validation. **Publish first.** |
| `tick-md` (CLI) | `cli` | Depends on core via `"@tick/core": "npm:@gianni-dalerta/tick-core@^X.Y.Z"` |
| `tick-mcp-server` | `mcp` | Depends on core the same way |

Releases are published by GitHub Actions (`.github/workflows/publish.yml`) using **npm trusted publishing (OIDC)**. There is no npm token: each package has a GitHub Actions trusted publisher on npmjs.com (org `Purple-Horizons`, repo `tick-md`, workflow `publish.yml`, no environment). Publishes carry provenance.

The workflow runs when a `v*` tag is pushed, and the tag must equal the CLI version (`v` + `cli/package.json` version). It can also be started manually with `workflow_dispatch`. It publishes core → CLI → MCP and **skips any package whose exact version is already on npm**, so only the packages you bumped go out.

> Don't rename `publish.yml` or add a GitHub environment without updating all three trusted publishers on npmjs.com to match. OIDC publishing fails if they differ.

## Steps

1. **Bump versions** (semver) in the packages that changed:
   - `packages/tick-core/package.json`: new fields/APIs → minor, fixes → patch.
   - `cli/package.json`: new commands/flags → minor, fixes → patch.
   - `mcp/package.json`: only if MCP code changed or it needs a newer core.
   - If a package needs the new core, raise its `@tick/core` range (e.g. `npm:@gianni-dalerta/tick-core@^1.1.0`) in `cli/`, `mcp/`, and the root `package.json`.
   - Update the matching `version` / `@tick/core` entries in `package-lock.json` (edit just those lines, or run `npm install --package-lock-only` and review the diff).
2. **Verify locally**
   ```bash
   cd cli && npm ci && npm run build && npm test && node dist/cli.js --version
   cd ../mcp && npm ci && npm run build
   (cd ../packages/tick-core && npm pack --dry-run)   # check files + version
   ```
3. **Open a PR** with the bumps, wait for CI, and merge.
4. **Tag `main` and push the tag** (never force-push tags):
   ```bash
   git checkout main && git pull --ff-only
   git tag -a v1.3.0 -m "tick-md 1.3.0 / tick-core 1.1.0"
   git push origin v1.3.0
   ```
5. **Watch the run:** `gh run watch --repo Purple-Horizons/tick-md` (or the Actions tab). To publish without a new tag (e.g. a retry after fixing setup), run `gh workflow run publish.yml --ref main --repo Purple-Horizons/tick-md`.
6. **Verify**
   ```bash
   npm view @gianni-dalerta/tick-core version
   npm view tick-md version dependencies
   npx -y tick-md@latest --version
   ```

## If the publish job fails

- **`E404 Not Found - PUT`, `ENEEDAUTH`, or an OIDC/"trusted publisher" error:** the npm trusted publisher doesn't match this run. On npmjs.com → package → Settings → Trusted publishing, check org `Purple-Horizons`, repo `tick-md`, workflow `publish.yml`, and an empty environment, for **each** of the three packages. Also make sure the job has `permissions: id-token: write` and the npm version is ≥ 11.5.1 (the workflow upgrades npm).
- **Provenance `repository.url` error:** the package's `package.json` `repository.url` must be `https://github.com/Purple-Horizons/tick-md.git`.

After fixing, re-run. Already-published versions are skipped:
```bash
gh run rerun <run-id> --failed --repo Purple-Horizons/tick-md
# or start a fresh run from main (uses the workflow as it is on main):
gh workflow run publish.yml --ref main --repo Purple-Horizons/tick-md
```
Note: `gh run rerun` replays the workflow file **as it was at the tagged commit**. If the fix was to the workflow itself, use `gh workflow run ... --ref main`, or cut a new patch tag.

## Manual fallback (no Actions)

```bash
npm login                        # as gianni-dalerta; complete 2FA in the browser (each publish may ask for an OTP)
cd packages/tick-core && npm publish --access public
cd ../../cli && npm run build && npm publish --access public
cd ../mcp && npm run build && npm publish --access public   # only if bumped
```
Publish in that order. The CLI and MCP resolve `@tick/core` from npm, so core must exist first.
