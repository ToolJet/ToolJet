// Preloaded into the runner (`node -r`) by upgrade-from-3-21-58.spec.ts. After each statement run inside a transaction,
// prints the table locks the session holds that it has not printed yet, as `[lock] <migration> <up|beforeCommit>: <table> <mode>`.
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

const printed = new Set();
const query = PostgresQueryRunner.prototype.query;
PostgresQueryRunner.prototype.query = async function (...args) {
  const result = await query.apply(this, args);
  if (running && this.isTransactionActive) {
    for (const { table, mode } of await query.call(this, LOCKS_HELD)) {
      const lock = `${table} ${mode}`;
      if (printed.has(lock)) continue;
      printed.add(lock);
      print(`[lock] ${running}: ${lock}`);
    }
  }
  return result;
};
