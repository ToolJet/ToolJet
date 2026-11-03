import { Command, Flags } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { formatCommand, installDependencies } from '../../lib/app/deps';
import { formatError, formatSuccess } from '../../lib/log';

export default class AppInstall extends Command {
  static description =
    "Install the app's dependencies without running any package's install scripts (npm, pnpm or yarn, from the lockfile)";

  static examples = ['$ tooljet app install', '$ tooljet app install --frozen   # exactly the lockfile, as publish does'];

  static flags = {
    frozen: Flags.boolean({ description: 'Install exactly the lockfile and fail if package.json disagrees', default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppInstall);
    try {
      const project = Project.find();
      const cmd = installDependencies(project.frontend, { frozen: flags.frozen });
      this.log(formatSuccess(`Installed with ${formatCommand(cmd)} (no install scripts ran)`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
