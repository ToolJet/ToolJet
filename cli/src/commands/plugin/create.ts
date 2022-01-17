import { Command, Flags } from "@oclif/core";
import cli from "cli-ux";
import * as inquirer from "inquirer";

const execa = require("execa");
const path = require("path");
const { runner } = require('hygen')
const Logger = require('hygen/lib/logger')

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

    const idx = process.cwd().split('/').indexOf('tooljet')
    const rootPath = process.cwd().split('/').splice(0, idx + 1).join('/')
    const pluginsPath = path.join(rootPath, "plugins");
    const docsPath = path.join(rootPath, "docs");
    const defaultTemplates = path.join(rootPath, "plugins", '_templates')
    const hygenArgs = [
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
    ]

    cli.action.start('creating plugin')

    runner(hygenArgs, {
      templates: defaultTemplates,
      cwd: rootPath,
      logger: new Logger(console.log.bind(console)),
      createPrompter: () => require('enquirer'),
      exec: (action: any, body: string | any[]) => {
        const opts = body && body.length > 0 ? { input: body } : {}
        return require('execa').shell(action, opts)
      },
      debug: !!process.env.DEBUG
    })

    await execa("npx", ["lerna", "link", "convert"], { cwd: pluginsPath });

    cli.action.stop()

    this.log(`Plugin: ${args.plugin_name} created successfully`);

    let tree = cli.tree()
    tree.insert('plugins')

    let subtree = cli.tree()
    subtree.insert(`${args.plugin_name}`)
    tree.nodes.plugins.insert('packages', subtree)

    tree.display()
  }
}
