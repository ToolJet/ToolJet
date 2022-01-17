import { Command, Flags } from "@oclif/core";
import cli from "cli-ux";
import * as inquirer from "inquirer";
const execa = require("execa");
const path = require("path");
const rimraf = require("rimraf");

export default class Delete extends Command {
  static description = "Delete a tooljet plugin";

  static examples = [
    `$ tooljet plugin delete <name>`,
  ];

  static args = [
    { name: "plugin_name", description: "Name of the plugin", required: true },
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(Delete);


    const idx = process.cwd().split('/').indexOf('tooljet')
    const rootPath = process.cwd().split('/').splice(0, idx + 1).join('/')
    const pluginsPath = path.join(rootPath, "plugins");
    const pluginPath = path.join(rootPath, "plugins", "packages", `${args.plugin_name}`)
    const pluginDocPath = path.join(rootPath, "docs", "docs", "data-sources", `${args.plugin_name}.md`);

    inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: 'Are you sure?',
      default: 'yes'
    }).then( async (answers) => {
      if (answers.confirm) {
        cli.action.start('deleting plugin');
        rimraf.sync(pluginPath);
        rimraf.sync(pluginDocPath);
        await execa("npx", ["lerna", "link", "convert"], { cwd: pluginsPath });
        cli.action.stop()
        this.log(`Plugin: ${args.plugin_name} deleted successfully`);
      } else {
        cli.action.stop()
        this.log(`Aborted by user`);
      }
    });
  }
}
