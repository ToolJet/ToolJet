import { Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import * as path from 'path';

import { Project, GEN_FILE } from '../../lib/app/project';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { appLibrary, appLibraryLine, devBundleOwnerId, pullSnapshot, syncApp } from '../../lib/app/remote';
import { generateTypes } from '../../lib/app/typegen';
import { checkSources } from '../../lib/app/check';
import { targetFlags } from '../../lib/app/flags';
import { ApiClient } from '../../lib/library/api-client';
import { DevWatcher } from '../../lib/library/dev-watcher';
import { build } from '../../lib/library/builder';
import { formatError, formatSuccess, formatDuration, formatWarning } from '../../lib/log';
import { prepareDependencies } from '../../lib/app/sdk';
import {
  codeSavedLine,
  devSourceOwner,
  isSourceConflict,
  noSourceFlag,
  isVersionLocked,
  sourceConflictLines,
  sourceFlags,
  VERSION_LOCKED_LINE,
} from '../../lib/app/source-flags';
import {
  applyStoredSource,
  fetchStoredSource,
  readSourceState,
  storeSource,
  trustFileChanges,
  writeSourceState,
} from '../../lib/app/source-upload';
import { behindMessage, checkAgainstStored, hashProjectSource } from '../../lib/app/source-sync';
import type { ApiError } from '../../lib/app/session';
import { countsLine, failedScanSarif, scanProject, ScannerNotInstalledError, uploadScan } from '../../lib/app/scan';
import { branchLine, workingApp } from '../../lib/app/branch';
import { isServerMode } from '../../lib/server-mode';

/** How often a watching dev asks ToolJet for the stored code's revision. */
const STORED_CODE_POLL_MS = 5000;

export default class AppDev extends Command {
  static description = 'Build the app on every save and show it live in the ToolJet builder';

  static examples = [
    '$ tooljet app dev',
    '$ tooljet app dev --once   # build, upload and link once, then exit (agents, CI)',
  ];

  static flags = {
    debounce: Flags.integer({ description: 'Milliseconds to wait after a save', default: 200 }),
    once: Flags.boolean({ description: 'Build, upload and link once, then exit', default: false }),
    'trust-remote-config': Flags.boolean({
      description:
        'Pull and build code from ToolJet even when it changes what a build runs on this machine: build config, package.json, the lockfile, .npmrc, a stylesheet @config or @plugin and the files they load, components while recordRender is on, or any changed file, of any type, while a build config loads files by a computed name',
      default: false,
    }),
    scan: Flags.boolean({
      description: 'Scan each build and upload the result to the Security panel (never blocks the build)',
      default: true,
      allowNo: true,
    }),
    ...targetFlags,
    ...sourceFlags,
    ...noSourceFlag,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppDev);
    try {
      const project = Project.find();
      const app = project.readApp();
      if (!app.appId)
        throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
      const target = resolveAppTarget(flags, project.root);
      // First run in a fresh clone: install without running any package's install scripts.
      const deps = await prepareDependencies(project.frontend, { server: target.url });
      for (const line of deps.success) this.log(formatSuccess(line));
      for (const line of deps.warnings) this.log(formatWarning(line));
      const session = await openSession(target);
      const working = await workingApp(session, project.root, app);
      const version = working.app.version;
      if (working.branch) this.log(formatSuccess(branchLine(working.branch)));
      const snapshot = await pullSnapshot(session, app.appId, version?.id);
      const appId = app.appId;
      const { library, changed } = await project.useAppLibrary((wanted) =>
        appLibrary(session, { appId, versionId: snapshot.versionId }, wanted)
      );
      const { correlationId, name: libraryName } = library;
      if (changed) this.log(formatSuccess(appLibraryLine(library)));
      project.writeSnapshot(snapshot);
      fs.writeFileSync(path.join(project.frontend, GEN_FILE), generateTypes(app, snapshot));
      const client = new ApiClient(
        target.url,
        target.token,
        target.kind === 'session' ? { workspaceId: target.workspaceId! } : undefined
      );
      const where = { appId: app.appId, versionId: snapshot.versionId };
      const local = readSourceState(project.root);
      // A ToolJet without stored source answers 404: nothing is stored, and nothing to keep in step with.
      const storedSummary = await fetchStoredSource(session, where).catch(() => undefined);
      const sourceOwner = devSourceOwner(flags, local, storedSummary);
      // Code the ToolJet editor owns can change under this copy (the AI, the Code panel): dev keeps an eye on it.
      const followStored =
        !flags['source-replace'] && (storedSummary?.owner === 'platform' || local?.owner === 'platform');
      let warnedRevision: number | undefined;

      /**
       * Compares this copy with ToolJet's stored code. Behind it, the copy is pulled when its files are unchanged since
       * the last sync ('pulled': the pulled files start a new build), else nothing is uploaded ('behind').
       */
      const followStoredCode = async (quiet: boolean): Promise<'ok' | 'pulled' | 'behind'> => {
        if (!followStored) return 'ok';
        const summary = await fetchStoredSource(session, where).catch(() => undefined);
        const state = readSourceState(project.root);
        const check = checkAgainstStored(state, where.versionId, summary, hashProjectSource(project.root));
        if (check.kind === 'in-step') return 'ok';
        if (check.kind === 'same-files') {
          writeSourceState(project.root, {
            revision: check.revision,
            owner: 'platform',
            versionId: where.versionId,
            ...(summary?.contentHash ? { contentHash: summary.contentHash } : {}),
          });
          return 'ok';
        }
        if (check.clean) {
          const incoming = await fetchStoredSource(session, where, true);
          // Someone else's edit to what a build runs does not run here by itself. Server mode runs none of it.
          const changed =
            flags['trust-remote-config'] || isServerMode() ? [] : trustFileChanges(project.root, incoming);
          if (changed.length) {
            this.log(
              formatError(
                `Stopped: revision ${check.revision} on ToolJet changes ${changed.join(
                  ', '
                )}, which a build runs on this machine. ` +
                  'Nothing was pulled. Check the change in the editor, then run tooljet app dev --trust-remote-config to pull and build it.'
              )
            );
            process.exit(1);
          }
          const pulled = applyStoredSource(project.root, incoming, where.versionId);
          warnedRevision = undefined;
          this.log(
            `  ${formatSuccess(
              `Pulled revision ${check.revision} (changed in the editor or by AI): ${pulled.written} files written, ${pulled.removed} removed`
            )}`
          );
          return 'pulled';
        }
        if (!quiet || warnedRevision !== check.revision) this.log(`  ${formatWarning(behindMessage(check.revision))}`);
        warnedRevision = check.revision;
        return 'behind';
      };
      let synced = false;
      let warnedNoScanner = false;
      this.log(
        formatSuccess(
          `Live preview of "${app.name}" is on (${snapshot.queries.length} queries). Watching frontend/src ...\n`
        )
      );
      if (sourceOwner === 'platform' && !flags.source) {
        this.log(
          `  ${formatSuccess(
            'Each build also saves its code in ToolJet, where the editor and AI work on it (--no-source to stop)'
          )}\n`
        );
      }

      const onRebuild = async (
        result: Awaited<ReturnType<typeof build>> | { error: Error }
      ): Promise<boolean | 'pulled'> => {
        if ('error' in result) {
          this.log(`  ${formatError(`build failed: ${result.error.message}`)}`);
          return false;
        }
        if (result.tsErrors > 0) {
          this.log(`  ${formatError(`${result.tsErrors} TypeScript error(s); not uploaded`)}\n${result.tsErrorReport}`);
          return false;
        }
        // Never upload a copy that is behind ToolJet's code: the canvas would show it over the newer work.
        const followed = await followStoredCode(false);
        if (followed === 'pulled') return 'pulled';
        if (followed === 'behind') {
          this.log(`  ${formatWarning(flags.once ? 'Not uploaded' : 'Not uploaded; still watching')}`);
          return false;
        }
        for (const warning of result.warnings) this.log(`  ${formatWarning(warning)}`);
        const findings = checkSources(path.join(project.frontend, 'src'), project.readApp(), snapshot);
        for (const f of findings) this.log(`  ${formatWarning(`${f.file}:${f.line} ${f.message}`)}`);
        await client.uploadDev(correlationId, result.distDir);
        if (!synced) {
          const sync = await syncApp(
            session,
            { ...project.readApp(), version },
            { id: library.id, correlationId, name: libraryName, componentName: project.rootComponentName() },
            `dev:${await devBundleOwnerId(session, library.id)}`
          );
          synced = true;
          // The builder's origin, when it differs from the API's (a local stack serves them on two ports).
          const appUrl = process.env.TOOLJET_APP_URL ?? target.url;
          this.log(
            `  ${formatSuccess(
              `Linked the app's code (${sync.createdPages.length} route pages created). Open: ${sync.editorUrl(appUrl)}`
            )}`
          );
        }
        // The source follows every build, so the draft's stored code and the build it runs stay the same code (Save
        // version freezes that build). A platform-owned upload names its base revision, so editor edits are not lost.
        let stored = true;
        if (sourceOwner) {
          try {
            const saved = await storeSource(
              session,
              { appId: app.appId as string, versionId: snapshot.versionId, root: project.root },
              // This build was uploaded just above, from these files.
              { owner: sourceOwner, replace: flags['source-replace'], builtBundle: true }
            );
            this.log(`  ${formatSuccess(codeSavedLine(saved, flags.verbose))}`);
          } catch (err) {
            if (isVersionLocked(err)) this.log(`  ${formatWarning(VERSION_LOCKED_LINE)}`);
            else if (isSourceConflict(err))
              for (const line of sourceConflictLines(err as ApiError)) this.log(`  ${formatWarning(line)}`);
            else throw err;
            stored = false;
          }
        }
        // Scan every good build and send the result to the builder's Security panel. Never blocks the build or the upload.
        // After the source is stored, so the scan names the stored revision it is of (scannedSourceIdentity).
        if (flags.scan) {
          try {
            const scan = await scanProject(project.root);
            await uploadScan(
              session,
              { appId: app.appId as string, versionId: snapshot.versionId, root: project.root },
              scan,
              'dev'
            );
            this.log(
              `  ${formatSuccess(
                `Security scan: ${countsLine(scan.summary.counts)} (gate ${scan.summary.gate}); see the Security panel`
              )}`
            );
          } catch (err) {
            // No scanner on this computer says nothing about the app, so nothing goes to the panel everyone sees.
            if (err instanceof ScannerNotInstalledError) {
              if (!warnedNoScanner) this.log(`  ${formatWarning(err.message)}`);
              warnedNoScanner = true;
            } else {
              // Tell the Security panel the scan failed, so it never shows the last result (or nothing) as current.
              const reason = (err as Error).message.replace(/^The security scan did not run: /, '').slice(0, 500);
              const where = { appId: app.appId as string, versionId: snapshot.versionId, root: project.root };
              const reported = await uploadScan(session, where, { sarif: failedScanSarif(reason) }, 'dev').then(
                () => true,
                () => false
              );
              this.log(
                `  ${formatWarning(
                  `Security scan failed: ${reason}${reported ? ' (shown in the Security panel)' : '; not uploaded'}`
                )}`
              );
            }
          }
        }
        this.log(
          `  ${formatSuccess(
            `[${new Date().toISOString()}] built in ${formatDuration(result.buildMs)}, uploaded (${
              result.bundleSizeKb
            } KB)`
          )}`
        );
        return stored;
      };

      const buildOnce = async () => onRebuild(await build(project.frontend).catch((error: Error) => ({ error })));
      if (flags.once) {
        let outcome = await buildOnce();
        // Pulled newer code: build that instead.
        if (outcome === 'pulled') outcome = await buildOnce();
        process.exit(outcome === true ? 0 : 1);
      }
      let building = false;
      DevWatcher.start({
        projectRoot: project.frontend,
        debounceMs: flags.debounce,
        onRebuild: async (r) => {
          building = true;
          try {
            await onRebuild(r);
          } finally {
            building = false;
          }
        },
      });
      // Between saves: pull the editor's or the AI's newer code when nothing local would be lost (the watcher then
      // rebuilds from it), else say once per revision how to bring it in.
      if (followStored) {
        setInterval(() => {
          if (!building) void followStoredCode(true).catch(() => undefined);
        }, STORED_CODE_POLL_MS).unref();
      }
      await new Promise(() => {});
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
