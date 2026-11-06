import { Command, Flags } from '@oclif/core';
import * as path from 'path';

import { scaffoldApp } from '../../lib/app/scaffold';
import { Project } from '../../lib/app/project';
import { openSession, signedInServer } from '../../lib/app/session';
import { projectServer, resolveAppTarget, writeProjectInstance } from '../../lib/app/instance';
import { createApp } from '../../lib/app/remote';
import { targetFlags } from '../../lib/app/flags';
import { prepareDependencies } from '../../lib/app/sdk';
import { formatError, formatSuccess, formatWarning } from '../../lib/log';

export default class AppInit extends Command {
  static description = 'Create an app project in Code mode: app.json and the React + TypeScript source in frontend/';

  static examples = [
    '$ tooljet app init orders --name "Orders"',
    '$ tooljet app init orders --name "Orders" --create   # also create the app in ToolJet',
  ];

  static args = [{ name: 'dir', description: 'Folder for the project', required: true }];

  static flags = {
    name: Flags.string({ description: 'The app name', required: true }),
    create: Flags.boolean({
      description: 'Create the app in ToolJet now and record its id in app.json',
      default: false,
    }),
    install: Flags.boolean({
      description: 'Install dependencies (no install scripts run)',
      default: true,
      allowNo: true,
    }),
    ...targetFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppInit);
    try {
      scaffoldApp(args.dir, flags.name);
      const project = new Project(path.resolve(args.dir));
      if (flags.create) {
        const session = await openSession(resolveAppTarget(flags));
        const created = await createApp(session, flags.name);
        project.writeApp({ ...project.readApp(), appId: created.id });
        writeProjectInstance(project.root, session.url);
        this.log(formatSuccess(`Created the app "${flags.name}" in ToolJet (${created.id})`));
      }
      this.log(formatSuccess(`Created ${args.dir}/ (app.json, frontend/)`));
      if (flags.install) {
        const { success, warnings } = await prepareDependencies(project.frontend, {
          always: true,
          server: flags.create ? projectServer(project.root) : signedInServer(flags),
        });
        for (const line of success) this.log(formatSuccess(line));
        for (const line of warnings) this.log(formatWarning(line));
        this.log(`\nNext: cd ${args.dir} && tooljet app pull && tooljet app dev\n`);
      } else {
        this.log(`\nNext: cd ${args.dir} && tooljet app install && tooljet app pull && tooljet app dev\n`);
      }
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
