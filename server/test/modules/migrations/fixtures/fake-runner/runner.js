// Stands in for the setup command: prints what run-all-migrations prints. argv[2]: `fail` fails the
// second migration; `skip` finds another server holding the lock; `none` finds nothing pending;
// `slow` keeps running until killed.
const fail = process.argv[2] === 'fail';
if (process.argv[2] === 'slow') {
  console.log('[migrations] 1 migration(s) pending: SlowThing1');
  console.log('[migrations] START SlowThing1');
  setTimeout(() => undefined, 60_000);
  return;
}
if (process.argv[2] === 'none') {
  console.log('[migrations] No expand or backfill migrations pending.');
  process.exit(0);
}
if (process.argv[2] === 'skip') {
  console.log('[migrations] Another server is running migrations; leaving the run to it.');
  process.exit(75);
}
const lines = [
  '[migrations] 2 migration(s) pending: AddThing1, BackfillThing2',
  '[migrations] START AddThing1',
  '[migrations] DONE AddThing1 12ms',
  '[migrations] START BackfillThing2',
  'BackfillThing2: [PROGRESS] 5/10 (50%)',
];
for (const line of lines) console.log(line);
if (fail) {
  console.error('QueryFailedError: deadlock detected');
  process.exit(1);
}
console.log('[migrations] DONE BackfillThing2 40ms');
