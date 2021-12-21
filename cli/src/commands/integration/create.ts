import {Command} from '@oclif/core'
// const path = require("path");
// const fs = require("fs-extra");

export default class Create extends Command {
  // [x: string]: any;
  static description = 'Create a new tooljet plugin package'

  static examples = [
    `$ tooljet integration create <name>`,
  ]

  static flags = {}

  static args = [{name: 'integration_name', description: 'Name of the integration', required: true}]

  async run(): Promise<void> {
    const {args} = await this.parse(Create)

    // this.targetDir = path.resolve(this.pkgsDir, args.integration_name);
    // this.libDir = path.join(this.targetDir, "lib");
    // this.libFileName = `${this.dirName}.ts`;

    // this.testDir = path.join(this.targetDir, "__tests__");
    // this.testFileName = `${this.dirName}.test.ts`;

    // let chain = Promise.resolve();

    // chain = chain.then(() => fs.mkdirp(this.libDir));
    // chain = chain.then(() => fs.mkdirp(this.testDir));
    // chain = chain.then(() => Promise.all([this.writeReadme(), this.writeLibFile(), this.writeTestFile()]));

    this.log(`${args.integration_name}`)
  }
}
