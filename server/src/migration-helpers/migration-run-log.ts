import { LOCK_SENTINEL_MIGRATION_NAMES } from './migrations-table-gate';

export type MigrationStepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface MigrationStep {
  name: string;
  status: MigrationStepStatus;
}

/** What the async-mode tracker knows about a run, rebuilt from the runner's output. */
export interface RunProgress {
  /** Set once the runner holds the lock and found work; a run with no pending work never gets one. */
  hasPendingWork: boolean;
  migrations: MigrationStep[];
  currentMigration: string | null;
  /** Latest `[PROGRESS] i/total` of the current data migration. */
  progress: string | null;
  logTail: string[];
}

export const LOG_TAIL_LINES = 200;

export function emptyRunProgress(): RunProgress {
  return { hasPendingWork: false, migrations: [], currentMigration: null, progress: null, logTail: [] };
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const QUERY_PARAMETERS = /\s*--\s*PARAMETERS:.*$/;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/gi;
// TypeORM query logging from the runner: SQL noise, never progress.
const QUERY_LOG_NOISE = /^(query is slow:|execution time:)/;
const CONNECTION_URL = /\b(postgres(?:ql)?|redis|rediss|mysql|mongodb(?:\+srv)?):\/\/\S+/gi;

/** Log lines leave the pod: drop query parameters, emails and connection strings. */
export function redactLogLine(line: string): string {
  return line
    .replace(ANSI, '')
    .replace(QUERY_PARAMETERS, '')
    .replace(CONNECTION_URL, '[$1 url]')
    .replace(EMAIL, '[email]')
    .trimEnd();
}

const PENDING = /\[migrations\] \d+ migration\(s\) pending: (.+)$/;
const START = /\[migrations\] START (\S+)/;
const DONE = /\[migrations\] DONE (\S+) \d+ms/;
const PROGRESS = /^\w+: \[PROGRESS\] (\d+\/\d+)/;

const isSentinel = (name: string) => LOCK_SENTINEL_MIGRATION_NAMES.includes(name);

function setStatus(run: RunProgress, name: string, status: MigrationStepStatus): MigrationStep[] {
  if (isSentinel(name)) return run.migrations;
  const known = run.migrations.some((step) => step.name === name);
  const steps = known ? run.migrations : [...run.migrations, { name, status: 'pending' as const }];
  return steps.map((step) => (step.name === name ? { ...step, status } : step));
}

/** Folds one line of runner output into the run. Pure: returns a new object. */
export function applyLogLine(run: RunProgress, rawLine: string): RunProgress {
  const line = redactLogLine(rawLine);
  if (!line || QUERY_LOG_NOISE.test(line)) return run;
  const logTail = [...run.logTail, line].slice(-LOG_TAIL_LINES);

  const pending = line.match(PENDING);
  if (pending) {
    const names = pending[1].split(',').map((name) => name.trim());
    return {
      ...run,
      logTail,
      hasPendingWork: true,
      migrations: names.filter((name) => !isSentinel(name)).map((name) => ({ name, status: 'pending' })),
    };
  }

  const started = line.match(START);
  if (started && !isSentinel(started[1])) {
    return {
      ...run,
      logTail,
      currentMigration: started[1],
      progress: null,
      migrations: setStatus(run, started[1], 'running'),
    };
  }

  const done = line.match(DONE);
  if (done && !isSentinel(done[1])) {
    return { ...run, logTail, migrations: setStatus(run, done[1], 'done') };
  }

  const progress = line.match(PROGRESS);
  if (progress) return { ...run, logTail, progress: progress[1] };

  return { ...run, logTail };
}

/** The run ended non-zero: the migration that was running is the one that failed. */
export function markFailed(run: RunProgress): RunProgress {
  return {
    ...run,
    migrations: run.migrations.map((step) => (step.status === 'running' ? { ...step, status: 'failed' } : step)),
  };
}

/** Last error-looking lines, for the failure banner. */
export function errorSummary(run: RunProgress): string {
  const errorLines = run.logTail.filter((line) => /error|failed|exception/i.test(line));
  return (errorLines.length ? errorLines : run.logTail).slice(-3).join('\n');
}
