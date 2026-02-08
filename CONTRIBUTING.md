# Contributing to Tick.md

Thank you for your interest in contributing to Tick! We welcome contributions from the community.

## Code of Conduct

Be respectful, collaborative, and constructive. We're building tools to help people coordinate better.

## How to Contribute

### Reporting Bugs

**Before submitting**, check if the issue already exists in [GitHub Issues](https://github.com/Purple-Horizons/tick-md/issues).

**When reporting**:
1. Use a clear, descriptive title
2. Describe steps to reproduce
3. Include expected vs actual behavior
4. Add screenshots/logs if relevant
5. Mention your OS and Node version

**Template**:
```
**Bug Description**: Clear summary

**Steps to Reproduce**:
1. Run `tick init`
2. Run `tick add "Test"`
3. Error occurs

**Expected**: Task should be created
**Actual**: Error: "..."

**Environment**:
- OS: macOS 14.2
- Node: v20.10.0
- tick-md: v1.0.0
```

### Suggesting Features

Open an issue with the `enhancement` label.

**Include**:
- Clear use case
- Why existing features don't solve it
- Proposed API/syntax (if CLI command)
- Mockups or examples

### Pull Requests

**Process**:
1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Write/update tests
5. Update documentation
6. Run tests: `npm test`
7. Build: `npm run build`
8. Commit with clear messages
9. Push and open PR

**PR Guidelines**:
- One feature/fix per PR
- Link related issues
- Include tests for new features
- Update README/docs if needed
- Follow existing code style

**Commit Messages**:
```
feat: add search command for task discovery
fix: resolve circular dependency detection bug
docs: update MCP server configuration guide
refactor: simplify parser error handling
test: add validation tests for agent registration
```

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/tick-md.git
cd tick-md

# Install dependencies
cd cli && npm install
cd ../mcp && npm install

# Build
cd cli && npm run build
cd ../mcp && npm run build

# Link for local testing
cd cli && npm link
cd ../mcp && npm link

# Test
tick init
tick status
```

### Project Structure

```
tick-md/
├── cli/                    # CLI package
│   ├── src/
│   │   ├── commands/       # Command implementations
│   │   ├── parser/         # TICK.md parsing
│   │   ├── utils/          # Utilities (git, lock, validator)
│   │   └── types.ts        # TypeScript types
│   └── package.json
├── mcp/                    # MCP server package
│   ├── src/
│   │   └── index.ts        # MCP tool definitions
│   └── package.json
├── clawhub-skill/          # ClawHub skill
│   ├── SKILL.md           # Bot coordination guide
│   ├── INSTALL.md         # Setup instructions
│   └── skill.json         # Metadata
└── docs/                   # Documentation
```

### Code Style

**TypeScript**:
- Use `async/await` over callbacks
- Explicit return types for public functions
- Descriptive variable names
- Comments for complex logic

**CLI Commands**:
- Follow existing pattern in `cli/src/commands/`
- Use `chalk` for colored output
- Handle errors gracefully
- Provide helpful error messages

**Tests**:
- Unit tests for utilities
- Integration tests for commands
- Test error cases

### Adding a New CLI Command

1. **Create command file**: `cli/src/commands/your-command.ts`
   ```typescript
   import * as fs from "node:fs";
   import chalk from "chalk";
   
   export async function yourCommand(options: YourOptions): Promise<void> {
     // Implementation
   }
   ```

2. **Wire in CLI**: `cli/src/cli.ts`
   ```typescript
   program
     .command("your-command")
     .description("Description")
     .option("-o, --option <value>", "Option description")
     .action(async (options) => {
       await yourCommand(options);
     });
   ```

3. **Add tests**: `cli/test/your-command.test.ts`

4. **Update README**: Document the new command

### Adding an MCP Tool

1. **Add tool definition**: `mcp/src/index.ts`
   ```typescript
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     switch (request.params.name) {
       case "tick_your_tool":
         // Implementation
         break;
     }
   });
   ```

2. **Update docs**: `clawhub-skill/mcp-reference.md`

### Documentation

Update docs when changing:
- CLI commands → `cli/README.md`
- MCP tools → `clawhub-skill/mcp-reference.md`
- Bot workflows → `clawhub-skill/SKILL.md`
- Setup process → `clawhub-skill/INSTALL.md`

### Testing

**Manual Testing**:
```bash
# Create test project
mkdir test-tick && cd test-tick
tick init

# Test commands
tick add "Test task" --priority high
tick status
tick list
tick graph
tick validate

# Test with Git
git init
tick sync --init --push
```

**Automated Testing** (coming soon):
```bash
npm test
npm run test:coverage
```

### Release Process

(Maintainers only)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run tests: `npm test`
4. Build: `npm run build`
5. Commit: `git commit -m "chore: release v1.x.x"`
6. Tag: `git tag v1.x.x`
7. Push: `git push --follow-tags`
8. Publish: `npm publish`

## Questions?

- Open a [Discussion](https://github.com/Purple-Horizons/tick-md/discussions)
- Check existing [Issues](https://github.com/Purple-Horizons/tick-md/issues)

## License

By contributing, you agree your contributions will be licensed under the MIT License.

---

**Thank you for helping make multi-agent coordination better!** 🚀
