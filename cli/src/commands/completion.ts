import fs from "fs/promises";
import path from "path";
import { parseTickFile } from "../parser/index.js";

export type ShellType = "bash" | "zsh" | "fish";

/**
 * Generate shell completion script
 */
export async function completionCommand(shell: ShellType): Promise<void> {
  let script: string;

  switch (shell) {
    case "bash":
      script = generateBashCompletion();
      break;
    case "zsh":
      script = generateZshCompletion();
      break;
    case "fish":
      script = generateFishCompletion();
      break;
    default:
      throw new Error(`Unsupported shell: ${shell}. Use bash, zsh, or fish.`);
  }

  console.log(script);
}

/**
 * Get dynamic completions for task IDs
 */
export async function getTaskIds(): Promise<string[]> {
  try {
    const tickPath = path.join(process.cwd(), "TICK.md");
    const content = await fs.readFile(tickPath, "utf-8");
    const tickFile = parseTickFile(content);
    return tickFile.tasks.map((t) => t.id);
  } catch {
    return [];
  }
}

/**
 * Get dynamic completions for agent names
 */
export async function getAgentNames(): Promise<string[]> {
  try {
    const tickPath = path.join(process.cwd(), "TICK.md");
    const content = await fs.readFile(tickPath, "utf-8");
    const tickFile = parseTickFile(content);
    return tickFile.agents.map((a) => a.name);
  } catch {
    return [];
  }
}

/**
 * Generate Bash completion script
 */
function generateBashCompletion(): string {
  return `# Tick CLI Bash Completion
# Add to ~/.bashrc or ~/.bash_profile:
#   source <(tick completion bash)
# Or save to a file:
#   tick completion bash > ~/.tick-completion.bash
#   echo 'source ~/.tick-completion.bash' >> ~/.bashrc

_tick_completions() {
    local cur prev words cword
    _init_completion || return

    local commands="init status add claim release done reopen delete edit comment sync validate repair conflicts compact history-stats agent list graph watch import undo batch broadcast broadcasts notify archive archived backup completion"
    local agent_commands="register list"
    local batch_commands="start commit abort status"
    local notify_commands="send list test"
    local backup_commands="list create restore show clean"
    local statuses="backlog todo in_progress review done blocked reopened"
    local priorities="urgent high medium low"

    # Get task IDs dynamically
    _tick_get_task_ids() {
        tick list --json 2>/dev/null | grep -o '"id":"[^"]*"' | cut -d'"' -f4
    }

    # Get agent names dynamically
    _tick_get_agents() {
        tick agent list 2>/dev/null | grep -o '@[a-zA-Z0-9_-]*' | sort -u
    }

    case "\${words[1]}" in
        add)
            case "\$prev" in
                -p|--priority) COMPREPLY=($(compgen -W "$priorities" -- "$cur")) ;;
                -t|--tags|-a|--assigned-to|-d|--description|--depends-on|--blocks|--estimated-hours) ;;
                *) COMPREPLY=($(compgen -W "-p --priority -t --tags -a --assigned-to -d --description --depends-on --blocks --estimated-hours --commit --no-commit" -- "$cur")) ;;
            esac
            ;;
        claim|release|done|reopen|comment)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$(_tick_get_task_ids)" -- "$cur"))
            elif [[ \$cword -eq 3 ]]; then
                COMPREPLY=($(compgen -W "$(_tick_get_agents)" -- "$cur"))
            fi
            ;;
        delete)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$(_tick_get_task_ids)" -- "$cur"))
            else
                COMPREPLY=($(compgen -W "-f --force --commit --no-commit" -- "$cur"))
            fi
            ;;
        edit)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$(_tick_get_task_ids)" -- "$cur"))
            elif [[ \$cword -eq 3 ]]; then
                COMPREPLY=($(compgen -W "$(_tick_get_agents)" -- "$cur"))
            else
                case "\$prev" in
                    -s|--status) COMPREPLY=($(compgen -W "$statuses" -- "$cur")) ;;
                    -p|--priority) COMPREPLY=($(compgen -W "$priorities" -- "$cur")) ;;
                    *) COMPREPLY=($(compgen -W "-s --status -p --priority --title -d --description -a --assigned-to -t --tags --depends-on --blocks" -- "$cur")) ;;
                esac
            fi
            ;;
        list)
            case "\$prev" in
                -s|--status) COMPREPLY=($(compgen -W "$statuses" -- "$cur")) ;;
                -p|--priority) COMPREPLY=($(compgen -W "$priorities" -- "$cur")) ;;
                *) COMPREPLY=($(compgen -W "-s --status -p --priority -a --assigned-to -c --claimed-by -t --tag -b --blocked --json" -- "$cur")) ;;
            esac
            ;;
        agent)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$agent_commands" -- "$cur"))
            fi
            ;;
        batch)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$batch_commands" -- "$cur"))
            fi
            ;;
        notify)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$notify_commands" -- "$cur"))
            fi
            ;;
        backup)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "$backup_commands" -- "$cur"))
            fi
            ;;
        undo)
            COMPREPLY=($(compgen -W "-f --force --dry-run -b --backup -l --list" -- "$cur"))
            ;;
        completion)
            if [[ \$cword -eq 2 ]]; then
                COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
            fi
            ;;
        *)
            if [[ \$cword -eq 1 ]]; then
                COMPREPLY=($(compgen -W "$commands" -- "$cur"))
            fi
            ;;
    esac
}

complete -F _tick_completions tick
`;
}

/**
 * Generate Zsh completion script
 */
function generateZshCompletion(): string {
  return `#compdef tick

# Tick CLI Zsh Completion
# Add to ~/.zshrc:
#   source <(tick completion zsh)
# Or save to fpath:
#   tick completion zsh > ~/.zsh/completions/_tick

_tick() {
    local -a commands
    commands=(
        'init:Initialize a new Tick project'
        'status:Show project status and task summary'
        'add:Create a new task'
        'claim:Claim a task for an agent'
        'release:Release a claimed task'
        'done:Mark a task as complete'
        'reopen:Reopen a completed task'
        'delete:Delete a task'
        'edit:Edit task fields'
        'comment:Add a comment to a task'
        'sync:Commit TICK.md changes to git'
        'validate:Validate TICK.md for errors'
        'repair:Auto-fix common TICK.md issues'
        'conflicts:Check for conflicts and concurrent agents'
        'compact:Compact task history to reduce file size'
        'history-stats:Show history statistics'
        'agent:Manage agents'
        'list:List tasks with filtering'
        'graph:Visualize task dependencies'
        'watch:Watch TICK.md for changes'
        'import:Import tasks from file'
        'undo:Undo last tick commit or restore backup'
        'batch:Batch mode for grouping changes'
        'broadcast:Send a message to squad log'
        'broadcasts:List recent broadcasts'
        'notify:Send notifications to webhooks'
        'archive:Archive completed tasks'
        'archived:List archived tasks'
        'backup:Manage TICK.md backups'
        'completion:Generate shell completion script'
    )

    local -a statuses priorities
    statuses=(backlog todo in_progress review done blocked reopened)
    priorities=(urgent high medium low)

    _tick_tasks() {
        local -a tasks
        tasks=(\${(f)"$(tick list --json 2>/dev/null | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"})
        _describe 'task' tasks
    }

    _tick_agents() {
        local -a agents
        agents=(\${(f)"$(tick agent list 2>/dev/null | grep -o '@[a-zA-Z0-9_-]*' | sort -u)"})
        _describe 'agent' agents
    }

    _arguments -C \\
        '1: :->command' \\
        '*:: :->args'

    case $state in
        command)
            _describe 'command' commands
            ;;
        args)
            case $words[1] in
                claim|release|done|reopen|comment)
                    _arguments \\
                        '1:task:_tick_tasks' \\
                        '2:agent:_tick_agents'
                    ;;
                delete)
                    _arguments \\
                        '1:task:_tick_tasks' \\
                        '-f[Force delete]' \\
                        '--force[Force delete]'
                    ;;
                edit)
                    _arguments \\
                        '1:task:_tick_tasks' \\
                        '2:agent:_tick_agents' \\
                        '-s[Set status]:status:($statuses)' \\
                        '--status[Set status]:status:($statuses)' \\
                        '-p[Set priority]:priority:($priorities)' \\
                        '--priority[Set priority]:priority:($priorities)'
                    ;;
                list)
                    _arguments \\
                        '-s[Filter by status]:status:($statuses)' \\
                        '--status[Filter by status]:status:($statuses)' \\
                        '-p[Filter by priority]:priority:($priorities)' \\
                        '--priority[Filter by priority]:priority:($priorities)' \\
                        '--json[Output as JSON]'
                    ;;
                add)
                    _arguments \\
                        '-p[Priority]:priority:($priorities)' \\
                        '--priority[Priority]:priority:($priorities)' \\
                        '-t[Tags]:tags:' \\
                        '--tags[Tags]:tags:'
                    ;;
                agent)
                    _arguments '1:subcommand:(register list)'
                    ;;
                batch)
                    _arguments '1:subcommand:(start commit abort status)'
                    ;;
                backup)
                    _arguments '1:subcommand:(list create restore show clean)'
                    ;;
                completion)
                    _arguments '1:shell:(bash zsh fish)'
                    ;;
            esac
            ;;
    esac
}

_tick
`;
}

/**
 * Generate Fish completion script
 */
function generateFishCompletion(): string {
  return `# Tick CLI Fish Completion
# Add to ~/.config/fish/completions/tick.fish:
#   tick completion fish > ~/.config/fish/completions/tick.fish

# Disable file completion by default
complete -c tick -f

# Main commands
complete -c tick -n "__fish_use_subcommand" -a "init" -d "Initialize a new Tick project"
complete -c tick -n "__fish_use_subcommand" -a "status" -d "Show project status"
complete -c tick -n "__fish_use_subcommand" -a "add" -d "Create a new task"
complete -c tick -n "__fish_use_subcommand" -a "claim" -d "Claim a task"
complete -c tick -n "__fish_use_subcommand" -a "release" -d "Release a task"
complete -c tick -n "__fish_use_subcommand" -a "done" -d "Complete a task"
complete -c tick -n "__fish_use_subcommand" -a "reopen" -d "Reopen a task"
complete -c tick -n "__fish_use_subcommand" -a "delete" -d "Delete a task"
complete -c tick -n "__fish_use_subcommand" -a "edit" -d "Edit task fields"
complete -c tick -n "__fish_use_subcommand" -a "comment" -d "Add a comment"
complete -c tick -n "__fish_use_subcommand" -a "sync" -d "Sync with git"
complete -c tick -n "__fish_use_subcommand" -a "validate" -d "Validate TICK.md"
complete -c tick -n "__fish_use_subcommand" -a "repair" -d "Auto-fix issues"
complete -c tick -n "__fish_use_subcommand" -a "conflicts" -d "Check for conflicts"
complete -c tick -n "__fish_use_subcommand" -a "compact" -d "Compact history"
complete -c tick -n "__fish_use_subcommand" -a "history-stats" -d "Show history stats"
complete -c tick -n "__fish_use_subcommand" -a "agent" -d "Manage agents"
complete -c tick -n "__fish_use_subcommand" -a "list" -d "List tasks"
complete -c tick -n "__fish_use_subcommand" -a "graph" -d "Show dependencies"
complete -c tick -n "__fish_use_subcommand" -a "watch" -d "Watch for changes"
complete -c tick -n "__fish_use_subcommand" -a "import" -d "Import tasks"
complete -c tick -n "__fish_use_subcommand" -a "undo" -d "Undo last change"
complete -c tick -n "__fish_use_subcommand" -a "batch" -d "Batch mode"
complete -c tick -n "__fish_use_subcommand" -a "broadcast" -d "Send broadcast"
complete -c tick -n "__fish_use_subcommand" -a "broadcasts" -d "List broadcasts"
complete -c tick -n "__fish_use_subcommand" -a "notify" -d "Send notification"
complete -c tick -n "__fish_use_subcommand" -a "archive" -d "Archive tasks"
complete -c tick -n "__fish_use_subcommand" -a "archived" -d "List archived"
complete -c tick -n "__fish_use_subcommand" -a "backup" -d "Manage backups"
complete -c tick -n "__fish_use_subcommand" -a "completion" -d "Shell completion"

# Task ID completions (dynamic)
function __tick_tasks
    tick list --json 2>/dev/null | string match -r '"id":"[^"]*"' | string replace -r '"id":"([^"]*)"' '$1'
end

# Agent completions (dynamic)
function __tick_agents
    tick agent list 2>/dev/null | string match -r '@[a-zA-Z0-9_-]+' | sort -u
end

# Subcommand completions
complete -c tick -n "__fish_seen_subcommand_from claim release done reopen comment" -a "(__tick_tasks)" -d "Task ID"
complete -c tick -n "__fish_seen_subcommand_from delete" -a "(__tick_tasks)" -d "Task ID"
complete -c tick -n "__fish_seen_subcommand_from edit" -a "(__tick_tasks)" -d "Task ID"

# Status completions
complete -c tick -n "__fish_seen_subcommand_from list edit" -l status -s s -a "backlog todo in_progress review done blocked reopened"

# Priority completions
complete -c tick -n "__fish_seen_subcommand_from add list edit" -l priority -s p -a "urgent high medium low"

# Agent subcommands
complete -c tick -n "__fish_seen_subcommand_from agent" -a "register list"

# Batch subcommands
complete -c tick -n "__fish_seen_subcommand_from batch" -a "start commit abort status"

# Backup subcommands
complete -c tick -n "__fish_seen_subcommand_from backup" -a "list create restore show clean"

# Completion shells
complete -c tick -n "__fish_seen_subcommand_from completion" -a "bash zsh fish"
`;
}
