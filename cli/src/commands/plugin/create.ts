import { Command, Flags } from "@oclif/core";
import cli from "cli-ux";
import * as inquirer from "inquirer";
const execa = require("execa");
const path = require("path");

export default class Create extends Command {
  static flags = {
    type: Flags.string({ options: ["database", "api", "cloud-storage"] }),
  };
  static description = "Create a new tooljet plugin";

  static examples = [
    `$ tooljet plugin create <name> --type=<database | api | cloud-storage>`,
  ];

  static args = [
    { name: "plugin_name", description: "Name of the plugin", required: true },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);

    let type = flags.type;

    const name = await cli.prompt("Enter plugin display name");

    if (!type) {
      let responses: any = await inquirer.prompt([
        {
          name: "type",
          message: "select a type",
          type: "list",
          choices: [
            { name: "database" },
            { name: "api" },
            { name: "cloud-storage" },
          ],
        },
      ]);
      type = responses.type;
    }

    const cliPath = path.join(process.cwd(), "/cli");
    const pluginsPath = path.join(process.cwd(), "/plugins");
    const docsPath = path.join(process.cwd(), "/docs");

    cli.action.start('creating plugin')

    await execa(
      "npx",
      [
        "hygen",
        "plugin",
        "new",
        "--name",
        `${args.plugin_name}`,
        "--type",
        `${type}`,
        "--display_name",
        `${name}`,
        "--plugins_path",
        `${pluginsPath}`,
        "--docs_path",
        `${docsPath}`,
      ],
      { cwd: cliPath }
    );

    await execa("npx", ["lerna", "link", "convert"], { cwd: pluginsPath });

    cli.action.stop()

    this.log(`Plugin: ${name} created successfully`);

    let tree = cli.tree()
    tree.insert('plugins')

    let subtree = cli.tree()
    subtree.insert(`${args.plugin_name}`)
    tree.nodes.bar.insert('packages', subtree)

    tree.display()
  }
}
