import * as fs from 'fs';
import * as path from 'path';

import { formatError } from '../log';

export interface ProjectConfigEntry {
  libraryId: string;
  libraryName: string;
  correlationId: string;
}

export interface WorkspaceLibrary {
  libraryId: string;
}

// libraryName/correlationId are shared across every workspace this project is registered
// for (same library, same identity) — only libraryId actually varies per workspace, since
// that's the workspace-scoped DB row. `workspaces` maps workspaceId -> { libraryId }.
export interface ProjectConfigFile {
  libraryName: string;
  correlationId: string;
  workspaces: Record<string, WorkspaceLibrary>;
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

  // Workspace comes from the CLI's current login (Auth.resolveOrExit()), not from the
  // config file itself — so this is where an authenticated-but-unregistered workspace
  // gets caught, distinct from a broken/missing config file.
  static resolveForWorkspaceOrExit(workspaceId: string, projectRoot: string = process.cwd()): ProjectConfigEntry {
    let file: ProjectConfigFile;
    try {
      file = ProjectConfig.readFile(projectRoot);
    } catch (err) {
      console.log(formatError((err as Error).message));
      process.exit(1);
    }

    const entry = file.workspaces[workspaceId];
    if (!entry) {
      console.log(
        formatError(
          `This project isn't registered for workspace "${workspaceId}". Run \`tooljet login\` to switch workspaces, or pass --origin-url and --api-token to target specific workspace directly.`
        )
      );
      process.exit(1);
    }

    return { libraryId: entry.libraryId, libraryName: file.libraryName, correlationId: file.correlationId };
  }

  private static isValid(data: unknown): data is ProjectConfigFile {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;

    const { libraryName, correlationId, workspaces } = data as Record<string, unknown>;
    if (typeof libraryName !== 'string' || !libraryName) return false;
    if (typeof correlationId !== 'string' || !correlationId) return false;
    if (!workspaces || typeof workspaces !== 'object' || Array.isArray(workspaces)) return false;

    const entries = Object.values(workspaces as Record<string, WorkspaceLibrary>);
    if (entries.length === 0) return false;

    return entries.every(
      (entry) =>
        !!entry &&
        typeof entry === 'object' &&
        typeof entry.libraryId === 'string' &&
        !!entry.libraryId
    );
  }
}
