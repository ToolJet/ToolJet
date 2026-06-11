import { Command } from '@oclif/core';
import * as chalk from 'chalk';
import * as os from 'os';
import * as childProcess from 'child_process';

function getPackageVersion() {
  try {
    return require(`./package.json`).version;
  } catch {
    return 'N/A';
  }
}

function getBinaryVersion(binaryName: string) {
  try {
    return childProcess.execSync(`${binaryName} --version`).toString().trim();
  } catch {
    return 'N/A';
  }
}

export class InfoCommand extends Command {
  static description = 'This command returns the information about where tooljet is being run';

  async run() {
    console.log(`
    Operating System:
      platform: ${chalk.green(os.platform())}
      arch: ${chalk.green(os.arch())}
      version: ${chalk.green(os.version())}
    Binaries:
      node: ${chalk.green(process.versions.node)}
      npm: ${chalk.green(getBinaryVersion('npm'))}
    Relevant packages:
      tooljet: ${chalk.green(getPackageVersion())}
    `);
  }
}
