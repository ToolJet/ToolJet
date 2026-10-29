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
  // Library-wide look, copied into the manifest: 'own' when the library draws in its own design system (it takes the
  // app theme only once one is applied), and the page and card look layouts around its components should match.
  themeMode?: 'own';
  surface?: Record<string, unknown>;
  // Run each component once during the build to record fields it declares through its own helper functions. Off by
  // default: the build then only reads the code, and runs none of it.
  recordRender?: boolean;
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

  /** The library-wide settings for the manifest; none when the project has no config (a build needs no login). */
  static readLibrarySettings(projectRoot: string = process.cwd()): Pick<ProjectConfigFile, 'themeMode' | 'surface'> {
    if (!fs.existsSync(path.join(projectRoot, '.tooljet', 'config.json'))) return {};
    const { themeMode, surface } = ProjectConfig.readFile(projectRoot);
    if (themeMode !== undefined && themeMode !== 'own') {
      throw new Error(`.tooljet/config.json: "themeMode" must be 'own'.`);
    }
    if (surface !== undefined && (!surface || typeof surface !== 'object' || Array.isArray(surface))) {
      throw new Error(`.tooljet/config.json: "surface" must be an object.`);
    }
    return { ...(themeMode ? { themeMode } : {}), ...(surface ? { surface } : {}) };
  }

  /** Whether the build records a render of each component (`recordRender` in .tooljet/config.json); off by default. */
  static readRecordRender(projectRoot: string = process.cwd()): boolean {
    if (!fs.existsSync(path.join(projectRoot, '.tooljet', 'config.json'))) return false;
    const { recordRender } = ProjectConfig.readFile(projectRoot);
    if (recordRender !== undefined && typeof recordRender !== 'boolean') {
      throw new Error('.tooljet/config.json: "recordRender" must be true or false.');
    }
    return recordRender === true;
  }

  private static isValid(data: unknown): data is ProjectConfigFile {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

    const { libraryName, correlationId } = data as Record<string, unknown>;
    if (typeof libraryName !== 'string' || !libraryName) return false;
    if (typeof correlationId !== 'string' || !correlationId) return false;

    return true;
  }
}
