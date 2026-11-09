import { Command } from '@oclif/core';

import { Project, GEN_FILE } from '../../lib/app/project';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { pullProject } from '../../lib/app/workspace';
import { targetFlags } from '../../lib/app/flags';
import { formatError, formatSuccess } from '../../lib/log';

export default class AppPull extends Command {
  static description =
    "Read the app's queries, tables and pages from ToolJet (the checked-out version, else the editing version) and write typed hooks to frontend/src/tooljet.gen.ts";

  static examples = ['$ tooljet app pull'];

  static flags = { ...targetFlags };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppPull);
    try {
      const project = Project.find();
      const snapshot = await pullProject(await openSession(resolveAppTarget(flags, project.root)), project);
      const typed = snapshot.queries.filter((q) => q.table && snapshot.tables[q.table]).length;
      const version = snapshot.versionName ? ` (version ${snapshot.versionName})` : '';
      this.log(
        formatSuccess(
          `Pulled "${snapshot.appName}"${version}: ${snapshot.queries.length} queries (${typed} with row types), ${snapshot.pages.length} pages`
        )
      );
      this.log(formatSuccess(`Wrote frontend/${GEN_FILE}`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
