import { LOCK_SENTINEL_MIGRATION_NAMES } from './migrations-table-gate';

export type MigrationStepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface MigrationStep {
  name: string;
  status: MigrationStepStatus;
  /** 0-100, from the migration's own progress logging. Absent when it logs none. */
  percent?: number;
  durationMs?: number;
}

/** What the async-mode tracker knows about a run, rebuilt from the runner's output. */
export interface RunProgress {
  /** Set once the runner holds the lock and found work; a run with no pending work never gets one. */
  hasPendingWork: boolean;
  migrations: MigrationStep[];
  currentMigration: string | null;
  logTail: string[];
  /** Inside a multi-line `parameters: [` block of an error dump: lines are dropped until it closes. */
  redactingParameters?: boolean;
}

export const LOG_TAIL_LINES = 200;

export function emptyRunProgress(): RunProgress {
  return { hasPendingWork: false, migrations: [], currentMigration: null, logTail: [] };
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
const DONE = /\[migrations\] DONE (\S+) (\d+)ms/;
// `NAME: [PROGRESS] [Label] i/total (p%)` and MigrationProgress's `NAME Progress N %`.
const COUNT_PROGRESS = /\[PROGRESS\]\D*?(\d+)\/(\d+)/;
const PERCENT_PROGRESS = /\bProgress (\d+) %/;

function parsePercent(line: string): number | null {
  const count = line.match(COUNT_PROGRESS);
  if (count) {
    const [done, total] = [Number(count[1]), Number(count[2])];
    return total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  }
  const percent = line.match(PERCENT_PROGRESS);
  return percent ? Math.min(100, Number(percent[1])) : null;
}

const isSentinel = (name: string) => LOCK_SENTINEL_MIGRATION_NAMES.includes(name);

function setStatus(run: RunProgress, name: string, patch: Partial<MigrationStep>): MigrationStep[] {
  if (isSentinel(name)) return run.migrations;
  const known = run.migrations.some((step) => step.name === name);
  const steps = known ? run.migrations : [...run.migrations, { name, status: 'pending' as const }];
  return steps.map((step) => (step.name === name ? { ...step, ...patch } : step));
}

export interface LogLineOptions {
  /** ORM_LOGGING is on: the operator asked for query lines, so they are kept (parameters still redacted). */
  keepQueries?: boolean;
}

// A QueryFailedError dump prints its bound values as `parameters: [ ... ]`, often over several lines.
const PARAMETERS_START = /^(\s*parameters:\s*)\[/;
const PARAMETERS_END = /\]\s*,?$/;

/** Folds one line of runner output into the run. Pure: returns a new object. */
export function applyLogLine(run: RunProgress, rawLine: string, options?: LogLineOptions): RunProgress {
  const line = redactLogLine(rawLine);
  if (run.redactingParameters) return PARAMETERS_END.test(line) ? { ...run, redactingParameters: false } : run;
  const parameters = line.match(PARAMETERS_START);
  if (!parameters) return foldLine(run, line, options);
  return {
    ...foldLine(run, `${parameters[1]}[redacted]`, options),
    redactingParameters: !PARAMETERS_END.test(line),
  };
}

function foldLine(run: RunProgress, line: string, options?: LogLineOptions): RunProgress {
  if (!line || (options?.keepQueries !== true && QUERY_LOG_NOISE.test(line))) return run;
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
      migrations: setStatus(run, started[1], { status: 'running' }),
    };
  }

  const done = line.match(DONE);
  if (done && !isSentinel(done[1])) {
    return { ...run, logTail, migrations: setStatus(run, done[1], { status: 'done', durationMs: Number(done[2]) }) };
  }

  const percent = run.currentMigration ? parsePercent(line) : null;
  if (percent !== null) {
    const current = run.migrations.find((step) => step.name === run.currentMigration);
    // MigrationProgress logs once per row: keep one line per percent, not millions.
    if (current?.percent === percent) return run;
    return {
      ...run,
      logTail,
      migrations: run.migrations.map((step) => (step === current ? { ...step, percent } : step)),
    };
  }

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
