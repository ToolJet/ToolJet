/** @group platform */
import {
  applyLogLine,
  emptyRunProgress,
  errorSummary,
  LOG_TAIL_LINES,
  markFailed,
  redactLogLine,
  RunProgress,
} from 'src/migration-helpers/migration-run-log';

function replay(lines: string[]): RunProgress {
  return lines.reduce((run, line) => applyLogLine(run, line), emptyRunProgress());
}

describe('migration run log', () => {
  describe('redactLogLine | log lines leave the pod', () => {
    it.each([
      [
        'query is slow: INSERT INTO "users" VALUES ($1) -- PARAMETERS: ["secret"]',
        'query is slow: INSERT INTO "users" VALUES ($1)',
      ],
      ['invited jane.doe@acme.io', 'invited [email]'],
      ['connecting to postgres://user:pw@db:5432/tooljet', 'connecting to [postgres url]'],
      ['\u001b[33mquery is slow\u001b[39m', 'query is slow'],
    ])('should turn %j into %j', (input, expected) => {
      expect(redactLogLine(input)).toBe(expected);
    });
  });

  describe('applyLogLine | bound values in error dumps never reach the log', () => {
    it.each([
      [['  parameters: [', '    \'{"password":"hunter2"}\'', '  ],', '  driverError: error: boom']],
      [["  parameters: [ 'hunter2' ],", '  driverError: error: boom']],
      [['  parameters: [', "    [ 'id-1', 'id-2' ],", "    'hunter2'", '  ],', '  driverError: error: boom']],
      [['  parameters: [', '    [', "      'id-1'", '    ],', "    'hunter2'", '  ],', '  driverError: error: boom']],
    ])('should replace the parameters block in %j', (lines) => {
      const { logTail } = replay(lines);

      expect(logTail).toEqual(['  parameters: [redacted]', '  driverError: error: boom']);
    });
  });

  describe('applyLogLine | rebuilding a run from runner output', () => {
    const run = replay([
      '[migrations] 3 migration(s) pending: LockMigrationsTable1234567890000, AddIndex1700, BackfillX1800',
      '[migrations] START LockMigrationsTable1234567890000',
      '[migrations] START AddIndex1700',
      '[migrations] DONE AddIndex1700 12ms',
      '[migrations] START BackfillX1800',
      'BackfillX: [START] Backfilling: 5000',
      'BackfillX: [PROGRESS] 1200/5000 (24%)',
    ]);

    it('should list real migrations only, with their state', () => {
      expect(run).toMatchObject({
        hasPendingWork: true,
        currentMigration: 'BackfillX1800',
        migrations: [
          { name: 'AddIndex1700', status: 'done', durationMs: 12 },
          { name: 'BackfillX1800', status: 'running', percent: 24 },
        ],
      });
    });

    it.each([
      ['BackfillX: [PROGRESS] Resolved 30/40 (75%)', 75],
      ['BackfillX1800 Progress 42 %', 42],
    ])('should read the progress format %j', (line, percent) => {
      const next = applyLogLine(run, line);

      expect(next.migrations[1]).toEqual({ name: 'BackfillX1800', status: 'running', percent });
    });

    it('should drop a progress line that does not move the percent', () => {
      expect(applyLogLine(run, 'BackfillX: [PROGRESS] 1201/5000 (24%)')).toBe(run);
    });

    it('should drop query log lines unless ORM_LOGGING asked for them', () => {
      const query = 'query is slow: SELECT 1 -- PARAMETERS: ["secret"]';

      expect(applyLogLine(run, query).logTail).toBe(run.logTail);
      expect(applyLogLine(run, query, { keepQueries: true }).logTail.slice(-1)).toEqual(['query is slow: SELECT 1']);
    });

    it('should ignore progress lines before any migration starts', () => {
      expect(replay(['Seed Progress 50 %']).migrations).toEqual([]);
    });

    it('should mark the running migration as the failed one', () => {
      expect(markFailed(run).migrations).toEqual([
        { name: 'AddIndex1700', status: 'done', durationMs: 12 },
        { name: 'BackfillX1800', status: 'failed', percent: 24 },
      ]);
    });

    it('should not report pending work when the runner found nothing to do', () => {
      expect(replay(['[migrations] No schema or data migrations pending']).hasPendingWork).toBe(false);
    });

    it('should keep only the last lines of output', () => {
      const lines = Array.from({ length: LOG_TAIL_LINES + 5 }, (_, i) => `line ${i}`);

      expect(replay(lines).logTail).toHaveLength(LOG_TAIL_LINES);
      expect(replay(lines).logTail[0]).toBe('line 5');
    });
  });

  describe('errorSummary | failure banner text', () => {
    it('should prefer error lines over plain output', () => {
      const run = replay(['working', 'QueryFailedError: canceling statement due to lock timeout', 'more output']);

      expect(errorSummary(run)).toBe('QueryFailedError: canceling statement due to lock timeout');
    });
  });
});
