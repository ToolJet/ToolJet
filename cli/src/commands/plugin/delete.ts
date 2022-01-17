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

    const pluginsPath = path.join(process.cwd(), "/plugins");
    const pluginPath = path.join(process.cwd(), "/plugins", "/packages", `/${args.plugin_name}`)
    const pluginDocPath = path.join(process.cwd(), "/docs/docs/data-sources", `/${args.plugin_name}.md`);

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
