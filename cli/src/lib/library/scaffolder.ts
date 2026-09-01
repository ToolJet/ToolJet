import * as fs from 'fs';
import * as path from 'path';

const { runner } = require('hygen');
const Logger = require('hygen/dist/logger').default;

export interface ScaffoldOptions {
  workspaceId: string;
  libraryId: string;
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

// Writes/merges the library's .tooljet/config.json. Should be called only after the
// library has been registered on the server, since it embeds the remote libraryId.
// libraryName/correlationId are shared across every workspace (same library everywhere);
// only libraryId varies, so it's merged into the `workspaces` map under workspaceId
// alongside any other workspace already registered for this project.
export function writeLibraryConfig(name: string, options: ScaffoldOptions): void {
  const { workspaceId, libraryId, libraryName, correlationId } = options;

  const configPath = path.join(name, '.tooljet', 'config.json');

  let existingWorkspaces: Record<string, { libraryId: string }> = {};
  if (fs.existsSync(configPath)) {
    const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    existingWorkspaces = existingConfig.workspaces ?? {};
  }

  const config = {
    libraryName,
    correlationId,
    workspaces: { ...existingWorkspaces, [workspaceId]: { libraryId } },
  };
  fs.mkdirSync(path.join(name, '.tooljet'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
