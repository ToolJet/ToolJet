import { Command, Flags } from '@oclif/core';
import * as path from 'path';

import { Project } from '../../lib/app/project';
import { checkSources } from '../../lib/app/check';
import { lintAccessibility } from '../../lib/app/a11y';
import { openSession } from '../../lib/app/session';
import { resolveAppTarget } from '../../lib/app/instance';
import { pullSnapshot } from '../../lib/app/remote';
import { targetFlags } from '../../lib/app/flags';
import { formatError, formatSuccess, formatWarning } from '../../lib/log';
import { countsLine, findingsFromSarif, formatFinding, LocalScan, scanProject } from '../../lib/app/scan';
import { workingApp } from '../../lib/app/branch';

export default class AppCheck extends Command {
  static description =
    'Fail when the code names a query, route or page the app does not have, or when the security scan (code, secrets, dependencies) fails the gate; list accessibility warnings (jsx-a11y recommended rules)';

  static examples = [
    '$ tooljet app check',
    '$ tooljet app check --offline   # against the last pull, and no network checks in the scan',
    '$ tooljet app check --sarif scan.sarif --json',
  ];

  static flags = {
    offline: Flags.boolean({
      description:
        'Check against the last `tooljet app pull` instead of reading the app now; the security scan skips its network checks (they report "not run")',
      default: false,
    }),
    scan: Flags.boolean({ description: 'Run the security scan', default: true, allowNo: true }),
    sarif: Flags.string({ description: 'Write the security scan as SARIF 2.1.0 to this file' }),
    policy: Flags.string({ description: 'Scan policy JSON (the workspace policy decides at publish)' }),
    json: Flags.boolean({ description: 'Print one JSON report instead of text', default: false }),
    ...targetFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AppCheck);
    try {
      const project = Project.find();
      const app = project.readApp();
      let snapshot = project.readSnapshot();
      if (!flags.offline) {
        if (!app.appId) throw new Error('app.json has no appId: create the app or clone one, or pass --offline.');
        const session = await openSession(resolveAppTarget(flags, project.root));
        const { app: working } = await workingApp(session, project.root, app);
        snapshot = await pullSnapshot(session, app.appId, working.version?.id);
        project.writeSnapshot(snapshot);
      }
      if (!snapshot) throw new Error('Nothing pulled yet: run `tooljet app pull` first, or drop --offline.');
      const src = path.join(project.frontend, 'src');
      const findings = checkSources(src, app, snapshot);
      // Accessibility (eslint-plugin-jsx-a11y, recommended rules): warnings only for now, never a failure.
      const a11y = await lintAccessibility(src).catch((err) => {
        if (!flags.json) this.log(`Accessibility lint did not run: ${(err as Error).message}`);
        return [];
      });
      let scan: LocalScan | null = null;
      let scanError: string | null = null;
      if (flags.scan) {
        scan = await scanProject(project.root, {
          offline: flags.offline,
          policyFile: flags.policy,
          sarifOut: flags.sarif,
        }).catch((err) => {
          scanError = (err as Error).message;
          return null;
        });
      }
      const security = scan ? findingsFromSarif(scan.sarif) : [];
      const gateFailed = scan?.summary.gate === 'fail';
      if (flags.json) {
        this.log(
          JSON.stringify(
            {
              ok: !findings.length && !gateFailed,
              problems: findings,
              accessibility: a11y,
              security: scan
                ? {
                    gate: scan.summary.gate,
                    counts: scan.summary.counts,
                    notRun: scan.summary.notRun,
                    tools: scan.summary.tools,
                    findings: security,
                  }
                : { error: scanError ?? 'not run (--no-scan)' },
            },
            null,
            2
          )
        );
        if (findings.length || gateFailed) process.exit(1);
        return;
      }
      for (const w of a11y) this.log(`warning ${w.file}:${w.line}  ${w.message} (${w.rule})`);
      if (a11y.length) this.log(`${a11y.length} accessibility warning${a11y.length > 1 ? 's' : ''} (jsx-a11y)\n`);
      if (scanError) this.log(formatWarning(scanError));
      if (scan) {
        for (const f of security) this.log(formatFinding(f));
        for (const n of scan.summary.notRun)
          this.log(formatWarning(`not run: ${n.id} (${n.reason ?? 'no reason given'})`));
        const tools = scan.summary.tools.map((t) => `${t.name} ${t.version}`).join(', ');
        this.log(
          `Security scan by ${tools}: ${countsLine(scan.summary.counts)}; gate ${scan.summary.gate}${
            flags.sarif ? ` (SARIF in ${flags.sarif})` : ''
          }\n`
        );
      }
      if (findings.length || gateFailed) {
        for (const f of findings) this.log(formatError(`${f.file}:${f.line}  ${f.message}`));
        if (findings.length) this.log(`\n${findings.length} problem${findings.length > 1 ? 's' : ''}`);
        if (gateFailed)
          this.log(formatError('The security scan fails the gate (findings above marked [blocks release])'));
        process.exit(1);
      }
      this.log(
        formatSuccess(
          `No problems: ${snapshot.queries.length} queries, ${app.routes.length} routes, ${snapshot.pages.length} pages checked`
        )
      );
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
