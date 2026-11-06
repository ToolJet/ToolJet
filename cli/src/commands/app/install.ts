import { Command, Flags } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { prepareDependencies } from '../../lib/app/sdk';
import { projectServer } from '../../lib/app/instance';
import { formatError, formatSuccess, formatWarning } from '../../lib/log';

export default class AppInstall extends Command {
  static description =
    "Install the app's dependencies without running any package's install scripts (npm, pnpm or yarn, from the lockfile)";

  static examples = [
    '$ tooljet app install',
    '$ tooljet app install --frozen   # exactly the lockfile, as publish does',
  ];

  static flags = {
    frozen: Flags.boolean({
      description: 'Install exactly the lockfile and fail if package.json disagrees',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppInstall);
    try {
      const project = Project.find();
      const { success, warnings } = await prepareDependencies(project.frontend, {
        always: true,
        frozen: flags.frozen,
        server: projectServer(project.root),
      });
      for (const line of success) this.log(formatSuccess(line));
      for (const line of warnings) this.log(formatWarning(line));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
