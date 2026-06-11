import { Command, Flags, CliUx } from '@oclif/core';
const execa = require('execa');
const path = require('path');
const fs = require('fs');

export default class Install extends Command {
  static flags = {
    plugin: Flags.string({ required: true }),
  };
  static description = 'Installs a new npm module inside a tooljet plugin';

  static examples = [`$ tooljet plugin install <npm_module> --plugin <plugin_name>`];

  static args = [{ name: 'npm_module', description: 'Name of the npm module', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Install);
    const plugin = flags.plugin;
    const pluginPath = path.join('plugins', 'packages', `${plugin}`);

    if (!fs.existsSync(pluginPath)) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        'Error : Plugin not found, make sure that you are running this command in Tooljet directory'
      );
      process.exit(1);
    }

    CliUx.ux.action.start('adding npm module');
    await execa('npm', ['i', `${args.npm_module}`], { cwd: pluginPath });
    CliUx.ux.action.stop();

    this.log('\x1b[42m', '\x1b[30m', `Package: ${args.npm_module} added to ${plugin}`, '\x1b[0m');
  }
}
