import * as fs from 'fs';
import * as path from 'path';

const { runner } = require('hygen');
const Logger = require('hygen/dist/logger').default;

export interface ScaffoldOptions {
  instanceUrl: string;
  libraryId: string;
  libraryName: string;
}

// Scaffolds a new component library directory via hygen templates and
// writes its .tooljet/config.json.
export async function scaffoldProject(name: string, options: ScaffoldOptions): Promise<void> {
  const { instanceUrl, libraryId, libraryName } = options;

  const hygenArgs = ['component', 'new', '--name', name, '--display_name', libraryName];

  await runner(hygenArgs, {
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

  const configPath = path.join(name, '.tooljet', 'config.json');

  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const config = { ...existingConfig, instanceUrl, libraryId, libraryName };
  fs.mkdirSync(path.join(name, '.tooljet'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
