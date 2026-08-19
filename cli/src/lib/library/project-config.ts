import * as fs from 'fs';
import * as path from 'path';

export interface ProjectConfigData {
  workspaceId: string;
  libraryId: string;
  libraryName: string;
}

export class ProjectConfig {
  static read(projectRoot: string = process.cwd()): ProjectConfigData {
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
        '.tooljet/config.json is missing required fields. Re-run `tooljet library init` to regenerate it.'
      );
    }

    return data;
  }

  private static isValid(data: unknown): data is ProjectConfigData {
    if (!data || typeof data !== 'object') return false;

    const { workspaceId, libraryId, libraryName } = data as Record<string, string>;
    return (
      typeof workspaceId === 'string' && !!workspaceId &&
      typeof libraryId === 'string' && !!libraryId &&
      typeof libraryName === 'string' && !!libraryName
    );
  }
}
