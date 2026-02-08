# 🚀 Publishing Checklist for Tick.md v1.0.0

## ✅ Pre-Publishing (Complete)

- [x] All code built and tested
- [x] MIT License added
- [x] README with quickstart and badges
- [x] CONTRIBUTING.md with guidelines
- [x] SECURITY.md for vulnerability disclosure
- [x] GitHub Actions CI workflow
- [x] .gitignore properly configured
- [x] package.json files ready for npm
- [x] ClawHub skill package complete
- [x] Repository prepared for public release

## 📦 Step 1: Create GitHub Repository

```bash
# Initialize git (if not done)
cd /Users/gianni-dalerta/Projects/Purple-Horizons/tick-md
git init  # (already done)

# Create repo on GitHub: https://github.com/new
# Name: tick-md
# Description: Multi-agent task coordination via Git-backed Markdown
# Public: YES
# Don't initialize with README (we have one)

# Add remote and push
git remote add origin https://github.com/Purple-Horizons/tick-md.git
git branch -M main
git push -u origin main
```

**After pushing**:
- Add topics/tags on GitHub: `task-management`, `ai-agents`, `coordination`, `markdown`, `cli`, `mcp`
- Enable Issues and Discussions
- Add description and website URL (when available)

## 📦 Step 2: Publish CLI to npm

```bash
cd cli

# Verify build
npm run build

# Test install locally
npm link
tick --version

# Login to npm (first time only)
npm login

# Publish!
npm publish

# Verify published
npm info tick-md
```

**Package page**: https://npmjs.com/package/tick-md

## 📦 Step 3: Publish MCP Server to npm

```bash
cd ../mcp

# Verify build
npm run build

# Test locally
npm link
tick-mcp --help

# Publish!
npm publish

# Verify published
npm info tick-mcp-server
```

**Package page**: https://npmjs.com/package/tick-mcp-server

## 📦 Step 4: Publish to ClawHub

```bash
# Install ClawHub CLI
npm install -g clawhub

# Login (if required)
clawhub login

# Publish skill
cd ../clawhub-skill
clawhub publish

# Verify published
clawhub search tick
```

**Skill page**: https://clawhub.ai/skills/tick-coordination

## 📝 Step 5: Create GitHub Release

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0 - Public launch"
git push origin v1.0.0
```

On GitHub (https://github.com/Purple-Horizons/tick-md/releases/new):

**Tag**: v1.0.0  
**Title**: Tick.md v1.0.0 - Public Launch 🚀

**Description**:
```markdown
# 🎉 Tick.md v1.0.0 - Public Launch

Multi-agent task coordination via Git-backed Markdown. Coordinate work across human and AI agents using structured TICK.md files.

## ✨ What's Included

### CLI Tool (`tick-md`)
- 14 commands for complete task lifecycle
- Git integration
- Dependency tracking with auto-unblocking
- Real-time monitoring
- Visualization (ASCII/Mermaid)

### MCP Server (`tick-mcp-server`)
- 9 programmatic tools for AI agents
- Works with Cursor, Claude, Cline, and more
- Natural language coordination

### ClawHub Skill
- Bot coordination guide
- Installation for all editors
- Example workflows

## 📦 Installation

### CLI
\`\`\`bash
npm install -g tick-md
tick init
\`\`\`

### MCP Server
\`\`\`bash
npm install -g tick-mcp-server
\`\`\`

### Via ClawHub
\`\`\`bash
clawhub install tick-coordination
\`\`\`

## 🔗 Links

- [CLI on npm](https://npmjs.com/package/tick-md)
- [MCP on npm](https://npmjs.com/package/tick-mcp-server)
- [ClawHub Skill](https://clawhub.ai/skills/tick-coordination)
- [Documentation](https://github.com/Purple-Horizons/tick-md/tree/main/cli#readme)

## 💡 Quick Start

\`\`\`bash
# Initialize project
tick init

# Add task
tick add "Build feature" --priority high

# Register bot
tick agent register @bot --type bot

# Claim and complete
tick claim TASK-001 @bot
tick done TASK-001 @bot
\`\`\`

---

**Full Changelog**: https://github.com/Purple-Horizons/tick-md/commits/v1.0.0
```

## 📢 Step 6: Announce Launch

### Twitter/X
```
🚀 Launching Tick.md v1.0.0!

Multi-agent task coordination via Git-backed Markdown.

✅ 14 CLI commands
✅ MCP server for AI agents  
✅ Works with Cursor, Claude, Cline
✅ Git-native, local-first
✅ Open source (MIT)

npm install -g tick-md

#AI #DevTools #OpenSource
```

### Product Hunt
- Submit product
- Title: "Tick.md - Multi-agent coordination via Markdown"
- Tagline: "Git-backed task tracking for humans and AI agents"
- Include demo video/screenshots

### Hacker News
- Title: "Launch HN: Tick.md – Multi-agent task coordination via Git-backed Markdown"
- Explain the problem and solution
- Link to GitHub

### Dev.to / Hashnode
Write launch post explaining:
- Why we built it
- How it works
- Example workflows
- How to get started

## 🎥 Step 7: Create Demo (Optional but Recommended)

Record 5-minute demo showing:
1. `tick init` - Initialize project
2. `tick add` - Create tasks with dependencies
3. `tick graph` - Visualize
4. Bot claiming task via MCP
5. `tick watch` - Real-time monitoring
6. `tick sync` - Git integration

Upload to YouTube and add to README.

## 📊 Step 8: Monitor & Respond

After launch:
- Watch GitHub issues/discussions
- Monitor npm downloads
- Respond to questions on social media
- Track ClawHub installs
- Collect feedback for v1.1

## 🎯 Success Metrics

Track:
- ⭐ GitHub stars
- 📦 npm downloads (tick-md + tick-mcp-server)
- 🤖 ClawHub installs
- 💬 Community engagement (issues/discussions)
- 📝 Blog mentions and articles

---

## 🔧 Troubleshooting

### npm publish fails
- Check you're logged in: `npm whoami`
- Verify package name is available: `npm info tick-md`
- Check package.json version

### ClawHub publish fails
- Verify `skill.json` is valid
- Check all files are present
- Try `clawhub validate` first

### CI fails
- Check Node versions match
- Verify all dependencies install
- Test locally first

---

**You're ready to launch!** 🚀

Once published, update:
- Landing page with real links
- README badges with actual stats
- Any "coming soon" mentions
