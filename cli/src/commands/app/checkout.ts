import { Command, Flags } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { listVersions } from '../../lib/app/remote';
import { checkoutVersion } from '../../lib/app/workspace';
import { targetFlags } from '../../lib/app/flags';
import { formatError, formatSuccess } from '../../lib/log';

export default class AppCheckout extends Command {
  static description =
    "Work on one ToolJet version of the app (by name or id): pull, check, dev and publish then use it. With git sync, the git branch the folder is on already picks that branch's draft; checkout overrides it.";

  static examples = ['$ tooljet app checkout v3', '$ tooljet app checkout --list', '$ tooljet app checkout --editing'];

  static args = [{ name: 'version', description: 'Version name or id' }];

  static flags = {
    ...targetFlags,
    list: Flags.boolean({ description: "List the app's versions" }),
    editing: Flags.boolean({ description: "Follow the app's editing version again" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppCheckout);
    try {
      const project = Project.find();
      const app = project.readApp();
      if (!app.appId)
        throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
      const session = await openSession(resolveAppTarget(flags, project.root));
      if (flags.list || (!args.version && !flags.editing)) {
        for (const v of await listVersions(session, app.appId)) {
          const mark = app.version?.id === v.id ? '*' : ' ';
          this.log(`${mark} ${v.name}${v.status ? `  ${v.status.toLowerCase()}` : ''}  ${v.id}`);
        }
        if (!app.version) this.log('Following the editing version (no version checked out).');
        return;
      }
      if (args.version && flags.editing) throw new Error('Give a version or --editing, not both.');
      const result = await checkoutVersion(session, project, flags.editing ? null : args.version!);
      const name = result.version ? `version ${result.version.name}` : 'the editing version';
      this.log(
        formatSuccess(
          `Checked out ${name}: ${result.snapshot.queries.length} queries, ${result.snapshot.pages.length} pages`
        )
      );
      if (result.readOnly)
        this.log(
          `${name[0].toUpperCase()}${name.slice(
            1
          )} is not a draft: pull and check work, dev and publish need a draft version.`
        );
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
