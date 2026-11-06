import { Command } from '@oclif/core';

import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { cloneApp } from '../../lib/app/workspace';
import { targetFlags } from '../../lib/app/flags';
import { formatError, formatSuccess } from '../../lib/log';

export default class AppClone extends Command {
  static description = 'Create an app project linked to an existing ToolJet app (its Code mode routes, if it has any)';

  static examples = ['$ tooljet app clone 55414690-beaa-4fa6-b41b-b8102bd7d1d8 orders'];

  static args = [
    { name: 'appId', description: 'The ToolJet app id', required: true },
    { name: 'dir', description: 'Folder for the project (default: the app slug)' },
  ];

  static flags = { ...targetFlags };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppClone);
    try {
      const result = await cloneApp(await openSession(resolveAppTarget(flags)), args.appId, args.dir);
      const routes = result.project.readApp().routes.length;
      this.log(
        formatSuccess(
          `Cloned "${result.name}" into ${result.dir}/ (${result.snapshot.queries.length} queries, ${routes} routes)`
        )
      );
      if (result.source) {
        const { revision, written } = result.source;
        this.log(formatSuccess(`Pulled revision ${revision}: ${written} files written`));
      } else if (result.hasCodePage) {
        this.log("This app's code isn't saved in ToolJet. Copy it from your repository into frontend/.");
      }
      this.log(`Linked to ${result.instance}: app commands in this folder use your login there.`);
      this.log(`Next: cd ${result.dir} && tooljet app install && tooljet app dev`);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
