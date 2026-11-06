import { Command, Flags } from '@oclif/core';
import * as path from 'path';

import { Project } from '../../lib/app/project';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { appLibrary, appLibraryLine, devBundleOwnerId, pullSnapshot, syncApp } from '../../lib/app/remote';
import { checkSources } from '../../lib/app/check';
import { targetFlags } from '../../lib/app/flags';
import { codeSavedLine, sourceFlags } from '../../lib/app/source-flags';
import { fetchStoredSource, SourceOwner, storeSource } from '../../lib/app/source-upload';
import { ApiClient } from '../../lib/library/api-client';
import { build } from '../../lib/library/builder';
import { formatError, formatSuccess, formatWarning } from '../../lib/log';
import { requireLockfile } from '../../lib/app/deps';
import { prepareDependencies } from '../../lib/app/sdk';
import { ApiError } from '../../lib/app/session';
import {
  countsLine,
  failureLine,
  findingsFromSarif,
  findingsFromStatus,
  formatFinding,
  requestPublishScan,
  scanProject,
} from '../../lib/app/scan';
import { branchLine, workingApp } from '../../lib/app/branch';

export default class AppPublish extends Command {
  static description =
    "Save the app's draft as a version (Save version in the editor): build the code, store it on ToolJet as the " +
    "draft's code, check it, and save. ToolJet freezes that code with the version, so a released version always " +
    'runs the code it was saved with. Release and promote it in ToolJet.';

  static examples = ['$ tooljet app publish', '$ tooljet app publish --name v3'];

  static flags = {
    name: Flags.string({ char: 'n', description: "The version's name (default: the draft's name)" }),
    version: Flags.string({
      char: 'v',
      description: 'Ignored: code versions are made by Save version now (name the version with --name)',
      hidden: true,
    }),
    message: Flags.string({ char: 'm', description: 'A description for the version' }),
    'allow-findings': Flags.boolean({
      description:
        'Save even when the security scan fails the gate; releasing still needs Release anyway with a reason',
      default: false,
    }),
    ...targetFlags,
    ...sourceFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppPublish);
    try {
      const project = Project.find();
      const app = project.readApp();
      if (!app.appId) throw new Error('app.json has no appId.');
      if (flags.version) this.log(formatWarning('-v is ignored: the version is named with --name (default: the draft name).'));
      // The saved build uses exactly the tested dependency versions, installed without install scripts.
      requireLockfile(project.frontend);
      const target = resolveAppTarget(flags, project.root);
      const deps = await prepareDependencies(project.frontend, { frozen: true, server: target.url });
      for (const line of deps.success) this.log(formatSuccess(line));
      for (const line of deps.warnings) this.log(formatWarning(line));
      const session = await openSession(target);
      const working = await workingApp(session, project.root, app);
      const version = working.app.version;
      if (working.branch) this.log(formatSuccess(branchLine(working.branch)));
      const snapshot = await pullSnapshot(session, app.appId, version?.id);
      const findings = checkSources(path.join(project.frontend, 'src'), app, snapshot);
      if (findings.length) {
        for (const f of findings) this.log(formatError(`${f.file}:${f.line}  ${f.message}`));
        throw new Error('Fix these first (tooljet app check).');
      }
      const result = await build(project.frontend, { env: 'production' });
      if (result.tsErrors > 0) throw new Error(`${result.tsErrors} TypeScript error(s):\n${result.tsErrorReport}`);

      // 1. The draft runs this build: the dev track upload, pinned on the draft.
      const appId = app.appId;
      const { library, changed } = await project.useAppLibrary((wanted) =>
        appLibrary(session, { appId, versionId: snapshot.versionId }, wanted)
      );
      const { correlationId, name: libraryName } = library;
      if (changed) this.log(formatSuccess(appLibraryLine(library)));
      await new ApiClient(
        target.url,
        target.token,
        target.kind === 'session' ? { workspaceId: target.workspaceId! } : undefined
      ).uploadDev(correlationId, result.distDir);
      await syncApp(
        session,
        { ...app, version },
        { id: library.id, correlationId, name: libraryName, componentName: project.rootComponentName() },
        `dev:${await devBundleOwnerId(session, library.id)}`
      );
      // 2. ...and stores these files as its code, saying the build was made from them.
      const where = { appId: app.appId, versionId: snapshot.versionId };
      const owner = (flags.source as SourceOwner | undefined) ?? (await fetchStoredSource(session, where)).owner ?? 'platform';
      const stored = await storeSource(session, { ...where, root: project.root }, {
        owner,
        replace: flags['source-replace'],
        builtBundle: true,
      });
      this.log(formatSuccess(codeSavedLine(stored, flags.verbose)));
      // 3. The scan of that code, then Save version, which freezes it on the server.
      await this.securityGate(session, app.appId, snapshot.versionId, project.root, flags['allow-findings']);
      const name = flags.name ?? snapshot.versionName;
      if (!name) throw new Error('Name the version with --name.');
      await session.api(`/v2/apps/${app.appId}/versions/${snapshot.versionId}`, {
        method: 'PUT',
        body: { name, status: 'PUBLISHED', ...(flags.message ? { description: flags.message } : {}) },
      });
      this.log(formatSuccess(`Saved version ${name}. Release or promote it in ToolJet.`));
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }

  /*
    The server scans what is published (the version's stored source, else this project) with the workspace policy and
    keeps the result as the version's publish scan, which the release gate reads. An older server without the endpoint:
    scan here with the default policy.
  */
  private async securityGate(
    session: Parameters<typeof requestPublishScan>[0],
    appId: string,
    versionId: string,
    root: string,
    allow: boolean
  ) {
    let gate: string;
    let findings;
    let summary: string;
    try {
      const status = await requestPublishScan(session, { appId, versionId, root });
      gate = status.gate ?? 'pass';
      findings = findingsFromStatus(status, 'publish').filter((f) => f.blocking);
      const published = (status.scans ?? []).find((s: { source: string }) => s.source === 'publish');
      summary =
        failureLine(status, 'publish') ??
        `Security scan on ToolJet: ${countsLine(published?.counts ?? status.counts ?? {})}`;
      if (status.applicable === false) return;
    } catch (err) {
      if (!(err instanceof ApiError) || ![404, 405].includes(err.status)) throw err;
      const scan = await scanProject(root);
      gate = scan.summary.gate;
      findings = findingsFromSarif(scan.sarif).filter((f) => f.blocking);
      summary = `Security scan (local, default policy; this ToolJet has no publish scan): ${countsLine(
        scan.summary.counts
      )}`;
    }
    this.log(summary);
    if (gate !== 'fail') return;
    for (const f of findings) this.log(formatFinding(f));
    if (!allow) {
      throw new Error(
        summary.startsWith('Scan failed')
          ? 'The security scan did not complete and the workspace policy blocks on checks that did not run. Publish again to retry, or publish with --allow-findings (releasing then needs Release anyway with a reason in ToolJet).'
          : 'The security scan fails the gate. Fix the findings above, or publish with --allow-findings (releasing then needs Release anyway with a reason in ToolJet).'
      );
    }
    this.log(
      formatWarning(
        'Publishing with --allow-findings: the release stays blocked until someone with release permission releases it anyway with a reason.'
      )
    );
  }
}
