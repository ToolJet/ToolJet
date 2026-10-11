import * as fs from 'fs';
import * as path from 'path';

const { runner } = require('hygen');
const Logger = require('hygen/dist/logger').default;

export interface ScaffoldOptions {
  libraryName: string;
  correlationId: string;
}

// Scaffolds a new component library directory via hygen templates.
export async function scaffoldTemplate(name: string, displayName: string): Promise<void> {
  const hygenArgs = ['library', 'new', '--name', name, '--display_name', displayName];

  const result = await runner(hygenArgs, {
    templates: path.join(__dirname, '..', '..', '_templates'),
    cwd: process.cwd(),
    logger: new Logger(console.log.bind(console)),
    createPrompter: () => require('enquirer'),
    exec: (action: any, body: string | any[]) => {
      const opts = body && body.length > 0 ? { input: body } : {};
      return require('execa').shell(action, opts);
    },
    debug: !!process.env.DEBUG,
  });

  if (!result || !result.success) {
    throw new Error('Unable to scaffold component library. Please retry or report this issue to the ToolJet team.');
  }
}

// Writes the library's .tooljet/config.json. libraryName/correlationId are the same
// across every workspace this project gets deployed to — there's nothing per-workspace
// left to store, since existence in any given workspace is checked live against the server.
export function writeLibraryConfig(name: string, options: ScaffoldOptions): void {
  const { libraryName, correlationId } = options;

  const configPath = path.join(name, '.tooljet', 'config.json');
  const config = { libraryName, correlationId };

  fs.mkdirSync(path.join(name, '.tooljet'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
