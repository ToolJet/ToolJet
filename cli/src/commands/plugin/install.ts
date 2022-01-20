import { Command, Flags } from "@oclif/core";
import cli from "cli-ux";
const execa = require("execa");
const path = require("path");

export default class Install extends Command {
  static flags = {
    plugin: Flags.string({ required: true }),
  };
  static description = "Installs a new npm module inside a tooljet plugin";

  static examples = [
    `$ tooljet plugin install <npm_module> --plugin <plugin_name>`,
  ];

  static args = [
    { name: "npm_module", description: "Name of the npm module", required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Install);

    let plugin = flags.plugin;


    const idx = process.cwd().split('/').indexOf('tooljet')
    const rootPath = process.cwd().split('/').splice(0, idx + 1).join('/')

    const pluginPath = path.join(rootPath, "plugins", "packages", `${plugin}`)

    cli.action.start('adding npm module')

    await execa("npm", ["i", `${args.npm_module}`], { cwd: pluginPath });

    cli.action.stop()
  }
}
