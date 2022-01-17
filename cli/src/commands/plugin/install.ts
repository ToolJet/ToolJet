import { Command, Flags } from "@oclif/core";
import cli from "cli-ux";
const execa = require("execa");
const path = require("path");

export default class Create extends Command {
  static flags = {
    plugin: Flags.string({ required: true }),
  };
  static description = "Create a new tooljet plugin";

  static examples = [
    `$ tooljet plugin install <npm_module> --plugin=<plugin_name>`,
  ];

  static args = [
    { name: "npm_module", description: "Name of the npm module", required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);

    let plugin = flags.plugin;

    const pluginPath = path.join(process.cwd(), "/plugins", "/packages", `/${plugin}`)

    cli.action.start('adding npm module')

    await execa("npm", ["i", `${args.npm_module}`], { cwd: pluginPath });

    cli.action.stop()
  }
}
