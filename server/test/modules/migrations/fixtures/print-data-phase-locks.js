// Preloaded into the runner (`node -r`) by upgrade-from-3-21-58.spec.ts. After each statement run inside a transaction,
// prints the table locks that statement took, as `[lock] <statement #> <migration> <up|beforeCommit>: <table> <mode>`.
const { PostgresQueryRunner } = require('typeorm/driver/postgres/PostgresQueryRunner');

const LOCKS_HELD = `
  SELECT c.relname AS table, l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
  WHERE l.pid = pg_backend_pid() AND l.locktype = 'relation' AND c.relkind IN ('r', 'p')
    AND c.relnamespace = 'public'::regnamespace`;

let running = null;
const print = console.log;
console.log = (...args) => {
  const [, step, name] = String(args[0]).match(/^\[migrations\] (START|BEFORE COMMIT) (\w+)/) ?? [];
  if (name) running = `${name} ${step === 'START' ? 'up' : 'beforeCommit'}`;
  print(...args);
};

let statement = 0;
const query = PostgresQueryRunner.prototype.query;
const locksHeld = async (runner) =>
  new Set((await query.call(runner, LOCKS_HELD)).map(({ table, mode }) => `${table} ${mode}`));
PostgresQueryRunner.prototype.query = async function (...args) {
  const recording = running && this.isTransactionActive;
  const before = recording && (await locksHeld(this));
  const result = await query.apply(this, args);
  if (recording) {
    statement++;
    for (const lock of await locksHeld(this)) if (!before.has(lock)) print(`[lock] ${statement} ${running}: ${lock}`);
  }
  return result;
};
