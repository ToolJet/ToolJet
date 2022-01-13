import {Command, Flags} from '@oclif/core'
import cli from 'cli-ux'
import * as inquirer from 'inquirer'
// use spawn over exec to consume lesser memory
import {spawn} from 'child_process'
// import * as notifier from 'node-notifier'

export default class Create extends Command {
  static flags = {
    type: Flags.string({options: ['database', 'api', 'cloud-storage']})
  }
  static description = 'Create a new tooljet plugin'

  static examples = [
    `$ tooljet plugin create <name> --type=<database | api | cloud-storage>`,
  ]

  static args = [{name: 'plugin_name', description: 'Name of the plugin', required: true}]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)

    let type = flags.type

    const name = await cli.prompt('Enter plugin display name')

    if (!type) {
      let responses: any = await inquirer.prompt([{
        name: 'type',
        message: 'select a type',
        type: 'list',
        choices: [{name: 'database'}, {name: 'api'}, {name: 'cloud-storage'}],
      }])
      type = responses.type
    }

    const child = spawn('npx', ['hygen', 'plugin', 'new', '--name', `${name}`, '--type', `${type}`]);
    child.stderr.on("data", (_) => {
      this.log(`Plugin: file created successfully`);
    });

    child.on('error', (error: { message: any }) => {
      this.log(`error: ${error.message}`);
    });
  
    child.on("close", (code: any) => {
      this.log(`process exited with code ${code}`);
    });
  
    // notifier.notify({
    //   title: 'Tooljet',
    //   message: `Plugin ${name} created`
    // })

    this.log(`${name} ${type}`)
    this.log(`${name} ${type}`)
  }
}
