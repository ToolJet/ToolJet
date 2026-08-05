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
        '.tooljet/config.json not found. Run this command from a component library directory created with `tooljet component init`.'
      );
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
}
