# Build Session 5: Validation & Agent Management

**Date:** February 7, 2026  
**Duration:** ~30 minutes  
**Focus:** Build validation command, agent management commands, and circular dependency detection

## Completed Tasks

### ✅ TASK-020: Build tick validate command
- **Implementation:** `cli/src/commands/validate.ts` + `cli/src/utils/validator.ts`
- **Features:**
  - Validates TICK.md structure and content
  - Checks for duplicate task IDs
  - Validates task references (depends_on, blocks, assigned_to, claimed_by)
  - Detects circular dependencies in task graph
  - Logical validations (e.g., done tasks shouldn't be claimed)
  - Performance warnings (actual_hours > 2x estimated_hours)
  - Color-coded error/warning output with fix suggestions
  - Verbose mode for detailed stats
- **Output:** Displays errors (blocking), warnings (non-blocking), and validation summary

### ✅ TASK-021: Build tick agent register command
- **Implementation:** `cli/src/commands/agent.ts`
- **Features:**
  - Register new agents with type (human|bot), roles, and status
  - Prevents duplicate agent registration
  - Updates TICK.md metadata timestamp
  - Supports multiple roles (e.g., "backend,api")
  - Assigns default trust_level: "trusted"
  - Color-coded confirmation output

### ✅ TASK-022: Build tick agent list command
- **Implementation:** `cli/src/commands/agent.ts`
- **Features:**
  - Lists all registered agents with icons (👤 human, 🤖 bot)
  - Filter by status (working|idle|offline) or type (human|bot)
  - Verbose mode shows:
    - Trust level
    - Current tasks (claimed_by)
    - Completed tasks count
  - Status summary by count
  - Color-coded status display

## Technical Implementation

### Validation System

#### validator.ts
```typescript
export interface ValidationError {
  type: "error" | "warning";
  message: string;
  location?: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
```

**Key Validations:**
1. **Required Fields:** project name, task IDs, titles, created_by
2. **Unique IDs:** No duplicate task IDs allowed
3. **Valid References:**
   - `depends_on` points to existing tasks
   - `blocks` points to existing tasks
   - `assigned_to` and `claimed_by` reference registered agents
4. **Circular Dependencies:** DFS graph traversal to detect cycles
5. **Logical Consistency:**
   - Done tasks shouldn't have claimed_by
   - Actual hours significantly exceeding estimates (warning)
   - Tasks should have history entries

#### Circular Dependency Detection
- Uses depth-first search with recursion stack
- Detects cycles in task dependency graph
- Reports full cycle path (e.g., `TASK-001 → TASK-002 → TASK-003 → TASK-001`)
- Critical for preventing deadlocks in task workflows

### Agent Management

#### Agent Registration Flow
1. Check if agent already exists (prevent duplicates)
2. Create Agent object with:
   - `type`: "human" | "bot" (defaults to "human")
   - `roles`: array of role strings (defaults to ["developer"])
   - `status`: "working" | "idle" | "offline" (defaults to "idle")
   - `working_on`: null (initially)
   - `last_active`: current ISO timestamp
   - `trust_level`: "trusted" (default for new agents)
3. Append to `tickFile.agents` array
4. Update `meta.updated` timestamp
5. Serialize and write back to TICK.md

#### Agent Listing Flow
1. Parse TICK.md
2. Apply filters (status, type)
3. Display with color-coded status
4. In verbose mode, cross-reference with tasks:
   - Current tasks: filter tasks where `claimed_by === agent.name`
   - Completed tasks: filter tasks with history entry `{action: "done", who: agent.name}`
5. Show summary statistics

## CLI Commands Added

```bash
# Validation
tick validate              # Validate TICK.md structure
tick validate --verbose    # Show detailed stats

# Agent Management
tick agent register <name>                    # Register human agent
tick agent register <name> --type bot         # Register bot agent
tick agent register <name> --roles "dev,qa"   # With custom roles
tick agent register <name> --status idle      # With initial status

tick agent list                               # List all agents
tick agent list --status working              # Filter by status
tick agent list --type bot                    # Filter by type
tick agent list --verbose                     # Show detailed info
```

## Code Changes

### New Files
- `cli/src/utils/validator.ts` - Validation logic with circular dependency detection
- `cli/src/commands/validate.ts` - Validate command implementation
- `cli/src/commands/agent.ts` - Agent management commands

### Modified Files
- `cli/src/cli.ts` - Added validate and agent subcommands
  - Import AgentType from types
  - Wire up validate command with --verbose option
  - Wire up agent subcommands (register, list) with filters

### Type Corrections
Fixed agent command to match actual protocol types:
- `bot` not `ai` for AgentType
- `roles` (array) not `role` (string)
- `updated` not `updated_at` in ProjectMeta
- Status types: `working|idle|offline` not `available|busy|offline`

## Testing Results

### Validation Command
```bash
$ tick validate
🔍 Validating TICK.md...
────────────────────────────────────────────────────────────
✓ TICK.md is valid!

  3 tasks validated
  6 agents registered
```

### Agent List Command
```bash
$ tick agent list
📋 Agents (6)

👤 @gianni
   Status: working
   Roles: owner

🤖 @claude-code
   Status: working
   Roles: engineer

# ... (truncated)

──────────────────────────────────────────────────
Status summary:
  working: 3
  offline: 1
  idle: 2
```

### Agent Register Command
```bash
$ tick agent register test-bot --type bot --roles "backend,api"
✓ Agent 'test-bot' registered

  Type: bot
  Roles: backend, api
  Status: idle
```

## Key Learnings

### 1. YAML Format Compliance
- The old manually-created TICK.md used compact inline YAML format
- The `yaml` library requires proper multi-line YAML for nested mappings
- Running any CLI command that modifies TICK.md automatically fixes the format
- The serializer (built in Session 1) always outputs compliant YAML

### 2. Validator as Quality Gate
- Catches common mistakes (duplicate IDs, invalid references, circular deps)
- Provides actionable fix suggestions
- Warnings don't block but guide best practices
- Verbose mode useful for understanding project health

### 3. Agent Management Foundation
- Enables multi-agent coordination
- Supports both human and bot agents
- Role-based capabilities for future permissions
- Trust levels provide security framework

### 4. Type Safety Benefits
- TypeScript caught type mismatches (AgentType, AgentStatus)
- Forced alignment with protocol spec
- Prevented runtime errors from incorrect assumptions

## Architecture Patterns

### Validation Pattern
```typescript
// 1. Parse file
const tickFile = parseTickFile(content);

// 2. Run validations
const result = validateTickFile(tickFile);

// 3. Display results with colors
if (result.errors.length > 0) {
  // Show errors in red with fixes
}
if (result.warnings.length > 0) {
  // Show warnings in yellow
}
```

### Agent Management Pattern
```typescript
// Registration
1. Check existence (prevent duplicates)
2. Create with defaults
3. Append to array
4. Update timestamp
5. Serialize & write

// Listing
1. Parse & filter
2. Cross-reference with tasks (in verbose mode)
3. Display with color coding
4. Show summary stats
```

## Commands Status

| Command | Status | Description |
|---------|--------|-------------|
| `init` | ✅ | Initialize project |
| `status` | ✅ | Show project summary |
| `add` | ✅ | Create tasks |
| `claim` | ✅ | Claim tasks |
| `release` | ✅ | Release tasks |
| `done` | ✅ | Complete tasks |
| `comment` | ✅ | Add task comments |
| `sync` | ✅ | Git integration |
| **`validate`** | **✅** | **Validate TICK.md** |
| **`agent register`** | **✅** | **Register agents** |
| **`agent list`** | **✅** | **List agents** |

## Next Steps (Recommended Priority)

1. **MCP Server Integration** (High Value)
   - Enable AI agents to use tick commands via MCP protocol
   - Critical for AI-human coordination
   - Builds on all existing CLI commands

2. **Watch Mode** (Developer UX)
   - `tick watch` - Real-time file monitoring
   - Auto-validation on changes
   - Live status updates

3. **Task Filters & Search**
   - `tick list` with filters (by status, priority, agent, tags)
   - `tick search <query>` for task discovery
   - JSON output for scripting

4. **Agent Status Management**
   - `tick agent update <name> --status working`
   - Auto-update agent status based on claims
   - Activity tracking

5. **Dependency Visualization**
   - `tick graph` - ASCII dependency graph
   - Critical path analysis
   - Blocked task detection

## Metrics

- **New Commands:** 3 (`validate`, `agent register`, `agent list`)
- **New Files:** 3
- **Lines of Code:** ~450
- **Validation Rules:** 10+ checks (errors + warnings)
- **Test Results:** All commands validated successfully
- **TICK.md Health:** ✓ Valid (3 tasks, 6 agents)

## Git Status

All changes ready to commit:
- Validator implementation with circular dependency detection
- Agent management commands (register, list)
- CLI wiring for new commands
- Type corrections for protocol compliance
- BUILD_SESSION_5.md documentation

Run `tick sync --push -m "feat: add validation and agent management commands"` to commit and push.
