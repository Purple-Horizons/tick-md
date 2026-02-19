import { findTickFile as findFromCore, readTickFileSync, parseTickFile as parseFromCore } from "@tick/core";

export const findTickFile = (baseDir?: string): string | null => findFromCore(baseDir);

export const readTickFile = (tickPath?: string) => readTickFileSync(tickPath);

export const parseTickFile = (content: string) => parseFromCore(content);
