// Stands in for the setup command: prints what run-all-migrations prints. `fail` as argv[2] fails the second migration.
const fail = process.argv[2] === 'fail';
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
