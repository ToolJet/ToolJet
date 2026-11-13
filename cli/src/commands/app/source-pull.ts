import { Command, Flags } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { pullSnapshot } from '../../lib/app/remote';
import { targetFlags } from '../../lib/app/flags';
import { pullStoredCode } from '../../lib/app/source-sync';
import { fetchStoredSource, inStepWith, readSourceState } from '../../lib/app/source-upload';
import { formatError, formatSuccess } from '../../lib/log';
import { workingApp } from '../../lib/app/branch';

export default class AppSourcePull extends Command {
  static description =
    "Bring the source stored on ToolJet (edits saved in the ToolJet editor) into this project when it is newer than the project's last upload or pull";

  static examples = [
    '$ tooljet app source-pull',
    '$ tooljet app source-pull --force',
    '$ tooljet app source-pull --trust-remote-config',
  ];

  static flags = {
    ...targetFlags,
    force: Flags.boolean({
      description: "Take ToolJet's code over files changed here, keeping a copy of them in .tooljet/before-pull",
      default: false,
    }),
    'trust-remote-config': Flags.boolean({
      description:
        'Pull even when the code on ToolJet changes what a build runs on this machine: build config, package.json, the lockfile, .npmrc, or files a build config loads',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppSourcePull);
    try {
      const project = Project.find();
      const app = project.readApp();
      if (!app.appId)
        throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
      const session = await openSession(resolveAppTarget(flags, project.root));
      const { version } = (await workingApp(session, project.root, app)).app;
      const snapshot = await pullSnapshot(session, app.appId, version?.id);
      const where = { appId: app.appId, versionId: snapshot.versionId };
      const summary = await fetchStoredSource(session, where);
      const local = readSourceState(project.root);
      if (!summary.exists) {
        this.log(formatSuccess('No source is stored on ToolJet for this version yet'));
        return;
      }
      if (inStepWith(local, snapshot.versionId, summary)) {
        this.log(formatSuccess(`Already at revision ${summary.revision}`));
        return;
      }
      const result = await pullStoredCode(
        session,
        project.root,
        where,
        summary,
        flags.force,
        flags['trust-remote-config']
      );
      if (result.kind === 'untrusted') {
        this.log(
          formatError(
            `Not pulled. Revision ${result.revision} on ToolJet changes ${result.files.join(
              ', '
            )}, which a build runs on this machine. ` +
              'Check the change in the editor, then run tooljet app source-pull --trust-remote-config to pull it.'
          )
        );
        process.exit(1);
      }
      if (result.kind === 'same-files') {
        this.log(formatSuccess(`Already at revision ${result.revision}`));
        return;
      }
      if (result.kind === 'local-changes') {
        const shown = result.files.slice(0, 10).map((file) => `  ${file}`);
        if (result.files.length > shown.length) shown.push(`  and ${result.files.length - shown.length} more`);
        this.log(
          formatError(
            `Not pulled. These files differ from ToolJet's code (revision ${
              result.revision
            }) and a pull would overwrite them:\n${shown.join(
              '\n'
            )}\nTo take ToolJet's code and keep a copy of yours, run tooljet app source-pull --force.`
          )
        );
        process.exit(1);
      }
      this.log(
        formatSuccess(`Pulled revision ${result.revision}: ${result.written} files written, ${result.removed} removed`)
      );
      if (result.keptIn)
        this.log(formatSuccess(`A copy of your changed files (${result.kept}) is in ${result.keptIn}`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
