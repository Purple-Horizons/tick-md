# Releasing

Three npm packages live in this repo:

| Package | Path | Notes |
|---|---|---|
| `@gianni-dalerta/tick-core` | `packages/tick-core` | Parser, serializer, types, validation. **Publish first.** |
| `tick-md` (CLI) | `cli` | Depends on core via `"@tick/core": "npm:@gianni-dalerta/tick-core@^X.Y.Z"` |
| `tick-mcp-server` | `mcp` | Depends on core the same way |

Releases are published by GitHub Actions (`.github/workflows/publish.yml`) when a `v*` tag is pushed. The tag must equal the CLI version (`v` + `cli/package.json` version). The workflow publishes core → CLI → MCP and **skips any package whose exact version is already on npm**, so only the packages you bumped go out. It authenticates with the repo secret `NPM_TOKEN`.

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
5. **Watch the run:** `gh run watch --repo Purple-Horizons/tick-md` (or the Actions tab).
6. **Verify**
   ```bash
   npm view @gianni-dalerta/tick-core version
   npm view tick-md version dependencies
   npx -y tick-md@latest --version
   ```

## If the publish job fails with 401/403/EOTP

`NPM_TOKEN` is expired, revoked, or not allowed to bypass 2FA. Create a new npm **granular access token** (Read and write; packages `tick-md`, `tick-mcp-server`, `@gianni-dalerta/tick-core`; "bypass 2FA" enabled for automation), then:

```bash
gh secret set NPM_TOKEN --repo Purple-Horizons/tick-md   # paste the token when prompted
gh run rerun <run-id> --failed
```

Re-running is safe because already-published versions are skipped.

## Manual fallback (no Actions)

```bash
npm login                        # as gianni-dalerta; complete 2FA in the browser
cd packages/tick-core && npm publish --access public
cd ../../cli && npm run build && npm publish --access public
cd ../mcp && npm run build && npm publish --access public   # only if bumped
```
Publish in that order. The CLI and MCP resolve `@tick/core` from npm, so core must exist first.
