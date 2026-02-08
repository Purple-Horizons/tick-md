import fs from "fs/promises";
import path from "path";
import yaml from "yaml";

export interface TickConfig {
  git: {
    auto_commit: boolean;
    commit_prefix: string;
    push_on_sync: boolean;
  };
  locking: {
    enabled: boolean;
    timeout: number;
  };
  agents: {
    default_trust: string;
    require_registration: boolean;
  };
}

const DEFAULT_CONFIG: TickConfig = {
  git: {
    auto_commit: true,
    commit_prefix: "[tick]",
    push_on_sync: false,
  },
  locking: {
    enabled: true,
    timeout: 300,
  },
  agents: {
    default_trust: "full",
    require_registration: false,
  },
};

/**
 * Load configuration from .tick/config.yml
 * Falls back to defaults if file doesn't exist or is invalid
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<TickConfig> {
  const configPath = path.join(cwd, ".tick", "config.yml");

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const parsed = yaml.parse(content);

    // Merge with defaults to ensure all fields exist
    return {
      git: { ...DEFAULT_CONFIG.git, ...parsed.git },
      locking: { ...DEFAULT_CONFIG.locking, ...parsed.locking },
      agents: { ...DEFAULT_CONFIG.agents, ...parsed.agents },
    };
  } catch (error: any) {
    // Config file doesn't exist or is invalid - use defaults
    return DEFAULT_CONFIG;
  }
}

/**
 * Get a specific config value with type safety
 */
export async function getConfigValue<K extends keyof TickConfig>(
  section: K,
  cwd: string = process.cwd()
): Promise<TickConfig[K]> {
  const config = await loadConfig(cwd);
  return config[section];
}
