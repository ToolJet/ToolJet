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
    marketplace: Flags.boolean({ char: 'm' }), // TODO: remove this flag, and make it default
  };

  static examples = [`$ tooljet plugin delete <name> [--build]`];

  static args = [{ name: 'plugin_name', description: 'Name of the plugin', required: true }];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Delete);

    if (!flags.marketplace) {
      const responses: any = await inquirer.prompt([
        {
          name: 'marketplace',
          message: 'Is this a marketplace plugin?',
          type: 'confirm',
          default: false,
        },
      ]);
      flags.marketplace = responses.marketplace;
    }

    const pluginsPath = flags.marketplace ? 'marketplace' : 'plugins';
    const pluginPath =
      pluginsPath === 'marketplace'
        ? path.join('marketplace', 'plugins', args.plugin_name)
        : path.join('plugins', 'packages', `${args.plugin_name}`);

    const pluginDocPath =
      pluginsPath !== 'marketplace' ? path.join('docs', 'docs', 'data-sources', `${args.plugin_name}.md`) : '';

    if (
      !(fs.existsSync(pluginsPath) && fs.existsSync(pluginPath) && !flags.marketplace
        ? fs.existsSync(pluginDocPath)
        : true)
    ) {
      this.log(
        '\x1b[41m%s\x1b[0m',
        'Error : Plugin not found, make sure that you are running this command in Tooljet directory'
      );
      process.exit(1);
    }

    void inquirer
      .prompt({
        name: 'confirm',
        type: 'confirm',
        message: `Please confirm: Do you want to proceed with deleting the plugin [${args.plugin_name}] from your local machine?`,
        default: 'yes',
      })
      .then(async (answers: any) => {
        if (answers.confirm) {
          CliUx.ux.action.start('deleting plugin');
          rimraf.sync(pluginPath);
          if (flags.marketplace) {
            const pluginsJson = JSON.parse(
              fs.readFileSync(path.join('server', 'src', 'assets', 'marketplace', 'plugins.json'), 'utf8')
            );
            const index = pluginsJson.findIndex((plugin: any) => plugin.name === args.plugin_name);
            pluginsJson.splice(index, 1);

            fs.writeFileSync(
              path.join('server', 'src', 'assets', 'marketplace', 'plugins.json'),
              JSON.stringify(pluginsJson, null, 2)
            );

            CliUx.ux.action.stop();

            if (flags.build) {
              await execa('npm', ['run', 'build', '--workspaces'], { cwd: pluginsPath });
              CliUx.ux.action.stop();
            }
          } else {
            rimraf.sync(pluginDocPath);
            await execa('npx', ['lerna', 'link', 'convert'], { cwd: pluginsPath });
            CliUx.ux.action.stop();

            if (flags.build) {
              CliUx.ux.action.start('building plugins');
              await execa.command('npm run build:plugins', { cwd: process.cwd() });
              CliUx.ux.action.stop();
            }
          }

          this.log('\x1b[42m', '\x1b[30m', `Plugin: ${args.plugin_name} deleted successfully`, '\x1b[0m');
        } else {
          CliUx.ux.action.stop();
          this.log(`Aborted by user`);
        }
      });
  }
}
