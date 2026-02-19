# tick-md Skill

ClawHub-ready skill package for multi-agent task coordination.

## Package Structure

```
clawhub-skill/
├── SKILL.md              # Main skill documentation (ClawHub displays this)
├── skill.json            # Metadata for ClawHub registry
├── INSTALL.md            # Installation and editor setup
├── mcp-reference.md      # Complete MCP tools reference
├── CHANGELOG.md          # Version history
└── README.md             # This file
```

## Publishing to ClawHub

### Prerequisites
1. Install ClawHub CLI:
   ```bash
   npm install -g clawhub
   ```

2. Authenticate (if required):
   ```bash
   clawhub login
   ```

### Publishing

From this directory:
```bash
clawhub publish .
```

The CLI will:
- Package all files in this directory
- Read metadata from `skill.json`
- Upload to ClawHub registry
- Make available at `clawhub.ai/gianni-dalerta/tick-md`

### Updating

To publish a new version:
1. Update `skill.json` version (follow semver)
2. Update `CHANGELOG.md`
3. Run `clawhub publish .` again

```bash
# Example: publish v1.0.1
# 1. Edit skill.json: "version": "1.0.1"
# 2. Add entry to CHANGELOG.md
# 3. Publish
clawhub publish .
```

## Local Testing

Test the skill locally before publishing:

### Option 1: Copy to Cursor Skills
```bash
cp -r . ~/.cursor/skills/tick-md/
```

Restart Cursor and the skill will be available.

### Option 2: Use workspace skills
```bash
# In your project
mkdir -p skills
cp -r . skills/tick-md/
```

OpenClaw/Cursor will pick up skills from `./skills/` in the current workspace.

### Option 3: Install from ClawHub (after publishing)
```bash
clawhub search "tick-md"
clawhub install tick-md
```

## What Gets Published

When you run `clawhub publish .`, these files are included:
- ✅ `SKILL.md` - Main documentation (required, editor-agnostic)
- ✅ `skill.json` - Metadata (required)
- ✅ `INSTALL.md` - Installation guide (editor-specific setup)
- ✅ `mcp-reference.md` - API reference
- ✅ `CHANGELOG.md` - Version history
- ✅ `README.md` - Package info

Files automatically excluded:
- `.git/` directories
- `node_modules/`
- Hidden files (except necessary configs)

## Skill Metadata (skill.json)

The `skill.json` file controls how the skill appears on ClawHub:

```json
{
  "name": "tick-md",
  "version": "1.3.3",
  "summary": "Multi-agent task coordination using Git-backed Markdown files",
  "tags": ["coordination", "tasks", "agents", "git", "markdown"],
  "requirements": {
    "runtime": "node >=18",
    "packages": ["tick-md", "tick-mcp-server"],
    "binaries": ["tick", "tick-mcp", "git"],
    "config_paths": ["~/.cursor/mcp_config.json", ".vscode/claude_code_config.json"]
  }
}
```

**Key fields**:
- `name`: Unique identifier (lowercase, hyphens)
- `version`: Semver (e.g., "1.0.0")
- `summary`: Short description (< 100 chars)
- `tags`: For discovery and search
- `requirements`: Runtime and package dependencies

## Versioning Guidelines

Follow semantic versioning:
- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes

**Examples**:
- Add new CLI command → Minor version bump
- Change MCP tool arguments → Major version bump
- Fix typo in docs → Patch version bump

## User Installation

Once published, users can install with:

```bash
# Via ClawHub CLI
clawhub search "tick"
clawhub install tick-md

# Or direct npm install
npm install -g tick-md tick-mcp-server
```

## Support and Feedback

After publishing:
- Users can star/comment on ClawHub
- Monitor usage via ClawHub dashboard
- Respond to issues via GitHub (link in skill.json)

## Development Workflow

1. **Make changes** to SKILL.md or supporting files
2. **Test locally** by copying to skills directory
3. **Update version** in skill.json
4. **Update CHANGELOG.md**
5. **Publish**: `clawhub publish .`
6. **Verify** at clawhub.ai

## Related Packages

This skill depends on:
- **tick-md** (npm): CLI tool
- **tick-mcp-server** (npm): MCP server

These should be published to npm separately before publishing the skill to ClawHub.

## License

MIT - Same as Tick project
