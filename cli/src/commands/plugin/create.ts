import { Command, Flags, CliUx } from '@oclif/core';
import * as inquirer from 'inquirer';

const execa = require('execa');
const path = require('path');
const fs = require('fs');
const { runner } = require('hygen');
const Logger = require('hygen/dist/logger').default;

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

    const pluginsPath = 'marketplace';
    const docsPath = 'docs';
    const defaultTemplates = path.join(pluginsPath, '_templates');

    if (!(fs.existsSync(pluginsPath) && fs.existsSync(docsPath) && fs.existsSync(defaultTemplates))) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        `Error : ${pluginsPath}, docs or ${pluginsPath}/_templates directory missing, make sure that you are running this command in Tooljet directory`
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
    ];

    const buffer = fs.readFileSync(path.join('server', 'src', 'assets', 'marketplace', 'plugins.json'), 'utf8');
    const pluginsJson = JSON.parse(buffer);
    pluginsJson.map((plugin: any) => {
      if (plugin.id === args.plugin_name.toLowerCase()) {
        this.log('\x1b[41m%s\x1b[0m', 'Error : Plugin id already exists');
        process.exit(1);
      }
    });

    CliUx.ux.action.start('creating plugin');

    await runner(hygenArgs, {
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

    const plugin = {
      name: args.plugin_name,
      description: `${type} plugin from ${args.plugin_name}`,
      version: '1.0.0',
      id: `${args.plugin_name.toLowerCase()}`,
      author: 'Tooljet',
      timestamp: new Date().toUTCString(),
    };

    pluginsJson.push(plugin);

    const jsonString = JSON.stringify(pluginsJson, null, 2);
    fs.writeFileSync(path.join('server', 'src', 'assets', 'marketplace', 'plugins.json'), jsonString);

    CliUx.ux.action.stop();

    this.log('\x1b[42m', '\x1b[30m', `Plugin: ${args.plugin_name} created successfully`, '\x1b[0m');

    if (flags.build) {
      CliUx.ux.action.start('building plugins');
      await execa('npm', ['run', 'build', '--workspaces'], { cwd: pluginsPath });
      CliUx.ux.action.stop();
    }

    const tree = CliUx.ux.tree();
    tree.insert(pluginsPath);

    const subtree = CliUx.ux.tree();
    subtree.insert(`${args.plugin_name}`);
    tree.nodes[pluginsPath].insert('plugins', subtree);

    tree.display();
  }
}
