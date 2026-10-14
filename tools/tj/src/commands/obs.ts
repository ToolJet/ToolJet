// obs: the local OTel stack in tools/observability (Grafana :3900, OTLP :4317/:4318).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../args.ts';
import { setKeys } from '../env.ts';
import { repoAt } from '../repo.ts';
import { capture, run } from '../sh.ts';
import { logFile } from '../state.ts';
import { emit, since, TjError, ui } from '../ui.ts';

const GRAFANA = 'http://localhost:3900';
const OTLP = 'http://localhost:4318';

// Server reads per-signal URLs; agent, MCP and gateway read the standard endpoint.
export function otelEnv(): Record<string, string> {
  return {
    ENABLE_OTEL: 'true',
    OTEL_EXPORTER_OTLP_ENDPOINT: OTLP,
    OTEL_EXPORTER_OTLP_TRACES: `${OTLP}/v1/traces`,
    OTEL_EXPORTER_OTLP_METRICS: `${OTLP}/v1/metrics`,
    OTEL_EXPORTER_OTLP_LOGS: `${OTLP}/v1/logs`,
    OTEL_PROPAGATORS: 'tracecontext,baggage',
    OTEL_RESOURCE_ATTRIBUTES: 'deployment.environment.name=development',
  };
}

async function compose(cwd: string, label: string, args: string[]) {
  const { root } = await repoAt(cwd);
  const file = join(root, 'tools/observability/docker-compose.yml');
  if ((await capture('docker', ['info'], { cwd: root })).code !== 0) {
    throw new TjError('docker is not running', { hint: 'start Docker Desktop (or colima), then retry' });
  }
  await run(label, 'docker', ['compose', '-f', file, ...args], { cwd: root, log: logFile(root, 'obs') });
  return root;
}

export const obsUp: Command = {
  name: 'obs up',
  summary: 'Start the local observability stack (Grafana :3900, OTLP :4318)',
  usage: 'tj obs up [--wire]',
  options: { wire: { type: 'boolean', desc: 'Also write the OTEL_* keys into .env so the server exports to it' } },
  async run({ values, cwd }) {
    const t = Date.now();
    ui.step('starting observability stack');
    const envFile = join((await repoAt(cwd)).root, '.env');
    if (values.wire && !existsSync(envFile)) throw new TjError(`no ${envFile}`, { hint: 'tj setup --app' });
    await compose(cwd, 'obs up', ['up', '-d', '--wait']);
    let wired = false;
    if (values.wire) {
      writeFileSync(envFile, setKeys(readFileSync(envFile, 'utf8'), otelEnv()));
      wired = true;
    }
    ui.ok(`observability stack up ${since(t)}: ${GRAFANA}`);
    emit({ grafana: GRAFANA, otlp: OTLP, wired, env: otelEnv() });
  },
};

export const obsDown: Command = {
  name: 'obs down',
  summary: 'Stop the local observability stack',
  usage: 'tj obs down [--purge]',
  options: { purge: { type: 'boolean', desc: 'Also delete stored traces and logs' } },
  async run({ values, cwd }) {
    await compose(cwd, 'obs down', ['down', ...(values.purge ? ['-v'] : [])]);
    ui.ok('observability stack stopped');
    emit({ purged: Boolean(values.purge) });
  },
};

export const obsStatus: Command = {
  name: 'obs status',
  summary: 'Show observability containers',
  usage: 'tj obs status',
  async run({ cwd }) {
    const { root } = await repoAt(cwd);
    const file = join(root, 'tools/observability/docker-compose.yml');
    const r = await capture('docker', ['compose', '-f', file, 'ps', '--format', 'json'], { cwd: root });
    if (r.code !== 0) throw new TjError(`docker compose ps failed: ${r.err}`, { hint: 'is Docker running?' });
    const services = r.out ? r.out.split('\n').map((l) => JSON.parse(l) as { Service: string; State: string }) : [];
    emit({ grafana: GRAFANA, services: services.map((s) => ({ service: s.Service, state: s.State })) }, () => {
      for (const s of services) process.stdout.write(`${s.Service.padEnd(16)} ${s.State}\n`);
      if (!services.length) process.stdout.write('not running (tj obs up)\n');
    });
  },
};
