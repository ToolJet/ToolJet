import * as fs from 'fs';
import * as path from 'path';

import { formatError } from '../log';

// correlationId is the one stable, workspace-independent identifier for this local project —
// generated once at `init` and reused for every workspace it's deployed to (via find-or-create).
// There's no per-workspace data to track locally any more: existence in a given workspace is
// checked live against the server on every command instead of cached here.
export interface ProjectConfigFile {
  libraryName: string;
  correlationId: string;
}

export class ProjectConfig {
  static readFile(projectRoot: string = process.cwd()): ProjectConfigFile {
    const configPath = path.join(projectRoot, '.tooljet', 'config.json');

    if (!fs.existsSync(configPath)) {
      throw new Error(
        '.tooljet/config.json not found. Run this command from a component library directory created with `tooljet library init`.'
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      throw new Error('.tooljet/config.json is not valid JSON. Re-run `tooljet library init` to regenerate it.');
    }

    if (!ProjectConfig.isValid(data)) {
      throw new Error(
        '.tooljet/config.json is malformed or missing required fields. Re-run `tooljet library init` to regenerate it.'
      );
    }

    return data;
  }

  static readFileOrExit(projectRoot: string = process.cwd()): ProjectConfigFile {
    try {
      return ProjectConfig.readFile(projectRoot);
    } catch (err) {
      console.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  private static isValid(data: unknown): data is ProjectConfigFile {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

    const { libraryName, correlationId } = data as Record<string, unknown>;
    if (typeof libraryName !== 'string' || !libraryName) return false;
    if (typeof correlationId !== 'string' || !correlationId) return false;

    return true;
  }
}
