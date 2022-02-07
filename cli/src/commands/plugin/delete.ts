import { Command, CliUx, Flags } from '@oclif/core';
import * as inquirer from 'inquirer';
const execa = require('execa');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

export default class Delete extends Command {
  static description = 'Delete a tooljet plugin';

  static flags = {
    build: Flags.boolean({ char: 'b' }),
  };

  static examples = [`$ tooljet plugin delete <name> [--build]`];

  static args = [{ name: 'plugin_name', description: 'Name of the plugin', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Delete);

    const pluginsPath = 'plugins';
    const pluginPath = path.join('plugins', 'packages', `${args.plugin_name}`);
    const pluginDocPath = path.join('docs', 'docs', 'data-sources', `${args.plugin_name}.md`);

    if (!(fs.existsSync(pluginsPath) && fs.existsSync(pluginPath) && fs.existsSync(pluginDocPath))) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        'Error : Plugin not found, make sure that you are runing this command in Tooljet directory'
      );
      process.exit(1);
    }

    void inquirer
      .prompt({
        name: 'confirm',
        type: 'confirm',
        message: 'Are you sure?',
        default: 'yes',
      })
      .then(async (answers: any) => {
        if (answers.confirm) {
          CliUx.ux.action.start('deleting plugin');
          rimraf.sync(pluginPath);
          rimraf.sync(pluginDocPath);
          await execa('npx', ['lerna', 'link', 'convert'], { cwd: pluginsPath });
          CliUx.ux.action.stop();

          if (flags.build) {
            CliUx.ux.action.start('building plugins');
            await execa.command('npm run build:plugins', { cwd: process.cwd() });
            CliUx.ux.action.stop();
          }

          this.log('\x1b[42m', '\x1b[30m', `Plugin: ${args.plugin_name} deleted successfully`, '\x1b[0m');
        } else {
          CliUx.ux.action.stop();
          this.log(`Aborted by user`);
        }
      });
  }
}
