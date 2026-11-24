import { Command, Flags } from '@oclif/core';

import { Project } from '../../lib/app/project';
import { countsLine, findingsFromSarif, formatFinding, resolvePackageSpec, vetPackages } from '../../lib/app/scan';
import { formatError, formatSuccess, formatWarning } from '../../lib/log';

export default class AppVet extends Command {
  static description =
    'Check packages before adding them: malware and known vulnerabilities (OSV), versions published in the last 7 days, licence and the blocklist. Exits 1 when they fail the gate.';

  static examples = ['$ tooljet app vet date-fns@4.1.0 zod', '$ tooljet app vet left-pad --json'];

  static strict = false;

  static args = [{ name: 'packages', description: 'name, name@version or name@range, one or more', required: true }];

  static flags = {
    json: Flags.boolean({ description: 'Print one JSON report', default: false }),
    offline: Flags.boolean({
      description: 'Skip the network checks (they report "not run", never "passed")',
      default: false,
    }),
    policy: Flags.string({ description: 'Scan policy JSON' }),
  };

  async run(): Promise<void> {
    const { argv, flags } = await this.parse(AppVet);
    try {
      let cwd = process.cwd();
      try {
        cwd = Project.find().frontend;
      } catch {
        // Outside a project: npm's default registry.
      }
      const packages = (argv as string[]).map((spec) => resolvePackageSpec(spec, cwd));
      const result = await vetPackages(packages, { offline: flags.offline, policyFile: flags.policy });
      // The packages are checked through a lockfile made for the check, so the package is the place to point at.
      const findings = findingsFromSarif(result.sarif).map((f) => ({ ...f, location: f.package ?? f.location }));
      if (flags.json) {
        this.log(
          JSON.stringify(
            {
              ok: result.summary.gate === 'pass',
              gate: result.summary.gate,
              packages,
              counts: result.summary.counts,
              notRun: result.summary.notRun,
              findings,
            },
            null,
            2
          )
        );
      } else {
        for (const f of findings) this.log(formatFinding(f));
        for (const n of result.summary.notRun)
          this.log(formatWarning(`not run: ${n.id} (${n.reason ?? 'no reason given'})`));
        const line = `${packages.map((p) => `${p.name}@${p.version}`).join(', ')}: ${countsLine(
          result.summary.counts
        )}`;
        this.log(result.summary.gate === 'pass' ? formatSuccess(line) : formatError(`${line}; fails the gate`));
      }
      if (result.summary.gate !== 'pass') process.exit(1);
    } catch (err) {
      this.log(formatError((err as Error).message));
      process.exit(1);
    }
  }
}
