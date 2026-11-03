import { Command } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { openSession, resolveTarget } from '../../lib/app/session';
import { pullSnapshot } from '../../lib/app/remote';
import { targetFlags } from '../../lib/app/flags';
import { applyStoredSource, fetchStoredSource, inStepWith, readSourceState } from '../../lib/app/source-upload';
import { formatError, formatSuccess } from '../../lib/log';

export default class AppSourcePull extends Command {
  static description =
    "Bring the source stored on ToolJet (edits saved in the ToolJet editor) into this project when it is newer than the project's last upload or pull";

  static examples = ['$ tooljet app source-pull'];

  static flags = { ...targetFlags };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppSourcePull);
    try {
      const project = Project.find();
      const app = project.readApp();
      if (!app.appId) throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
      const session = await openSession(resolveTarget(flags));
      const snapshot = await pullSnapshot(session, app.appId, app.version?.id);
      const where = { appId: app.appId, versionId: snapshot.versionId };
      const summary = await fetchStoredSource(session, where);
      const local = readSourceState(project.root);
      if (!summary.exists) {
        this.log(formatSuccess('No source is stored on ToolJet for this version yet'));
        return;
      }
      if (inStepWith(local, snapshot.versionId, summary)) {
        this.log(formatSuccess(`Already at revision ${summary.revision} (owner ${summary.owner})`));
        return;
      }
      const result = applyStoredSource(project.root, await fetchStoredSource(session, where, true), snapshot.versionId);
      this.log(
        formatSuccess(
          `Pulled revision ${summary.revision} (owner ${summary.owner}): ${result.written} files written, ${result.removed} removed`
        )
      );
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
