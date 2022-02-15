import { Command, Flags, CliUx } from '@oclif/core';
import * as inquirer from 'inquirer';

const execa = require('execa');
const path = require('path');
const fs = require('fs');
const { runner } = require('hygen');
const Logger = require('hygen/lib/logger');

export default class Create extends Command {
  static flags = {
    type: Flags.string({ options: ['database', 'api', 'cloud-storage'] }),
    build: Flags.boolean({ char: 'b' }),
  };
  static description = 'Create a new tooljet plugin';

  static examples = [`$ tooljet plugin create <name> --type=<database | api | cloud-storage> [--build]`];

  static args = [{ name: 'plugin_name', description: 'Name of the plugin', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);

    if (Number(args.plugin_name)) {
      this.log('\x1b[41m%s\x1b[0m', 'Error : Plugin name can not be a number');
      process.exit(1);
    }

    let { type } = flags;

    const name = await CliUx.ux.prompt('Enter plugin display name');

    if (Number(name)) {
      this.log('\x1b[41m%s\x1b[0m', 'Error : Plugin Display name can not be a number');
      process.exit(1);
    }

    if (!type) {
      const responses: any = await inquirer.prompt([
        {
          name: 'type',
          message: 'select a type',
          type: 'list',
          choices: [{ name: 'database' }, { name: 'api' }, { name: 'cloud-storage' }],
        },
      ]);
      type = responses.type;
    }

    const pluginsPath = 'plugins';
    const docsPath = 'docs';
    const defaultTemplates = path.join('plugins', '_templates');

    if (!(fs.existsSync(pluginsPath) && fs.existsSync(docsPath) && fs.existsSync(defaultTemplates))) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        'Error : plugins, docs or plugins/_templates directory missing, make sure that you are runing this command in Tooljet directory'
      );
      process.exit(1);
    }

    const hygenArgs = [
      'plugin',
      'new',
      '--name',
      `${args.plugin_name}`,
      '--type',
      `${type}`,
      '--display_name',
      `${name}`,
      '--plugins_path',
      `${pluginsPath}`,
      '--docs_path',
      `${docsPath}`,
    ];

    CliUx.ux.action.start('creating plugin');

    runner(hygenArgs, {
      templates: defaultTemplates,
      cwd: process.cwd(),
      logger: new Logger(console.log.bind(console)),
      createPrompter: () => require('enquirer'),
      exec: (action: any, body: string | any[]) => {
        const opts = body && body.length > 0 ? { input: body } : {};
        return require('execa').shell(action, opts);
      },
      debug: !!process.env.DEBUG,
    });

    await execa('npx', ['lerna', 'link', 'convert'], { cwd: pluginsPath });
    CliUx.ux.action.stop();

    if (flags.build) {
      CliUx.ux.action.start('building plugins');
      await execa.command('npm run build:plugins', { cwd: process.cwd() });
      CliUx.ux.action.stop();
    }

    this.log('\x1b[42m', '\x1b[30m', `Plugin: ${args.plugin_name} created successfully`, '\x1b[0m');

    const tree = CliUx.ux.tree();
    tree.insert('plugins');

    const subtree = CliUx.ux.tree();
    subtree.insert(`${args.plugin_name}`);
    tree.nodes.plugins.insert('packages', subtree);

    tree.display();
  }
}
