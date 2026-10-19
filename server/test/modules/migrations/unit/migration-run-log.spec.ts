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
  return lines.reduce(applyLogLine, emptyRunProgress());
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
        progress: '1200/5000',
        migrations: [
          { name: 'AddIndex1700', status: 'done' },
          { name: 'BackfillX1800', status: 'running' },
        ],
      });
    });

    it('should mark the running migration as the failed one', () => {
      expect(markFailed(run).migrations).toEqual([
        { name: 'AddIndex1700', status: 'done' },
        { name: 'BackfillX1800', status: 'failed' },
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
