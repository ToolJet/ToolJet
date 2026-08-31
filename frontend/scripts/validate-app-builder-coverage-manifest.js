const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '..');
const appBuilderRoot = path.join(frontendRoot, 'src/AppBuilder');
const manifest = require('../app-builder-coverage-manifest.json');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function isEligible(absolute) {
  const relative = path.relative(frontendRoot, absolute).split(path.sep).join('/');
  if (!sourceExtensions.has(path.extname(absolute)) || relative.endsWith('.d.ts')) return false;
  if (relative.includes('/__tests__/') || relative.includes('/__mocks__/')) return false;
  if (/\.(test|spec|stories)\.[jt]sx?$/.test(relative)) return false;
  return !relative.includes('/test-fixtures/');
}

const subsystemIds = new Set(manifest.subsystems.map(({ id }) => id));
const errors = [];
if (subsystemIds.size !== 10) errors.push(`Expected 10 unique subsystems, found ${subsystemIds.size}`);
if (manifest.target.enforcement !== 'report-only') errors.push('Coverage enforcement must remain report-only');
for (const subsystem of manifest.subsystems) {
  if (subsystem.owner !== '') errors.push(`Owner must remain empty during adoption: ${subsystem.id}`);
}

const counts = Object.fromEntries([...subsystemIds].map((id) => [id, 0]));
const eligible = walk(appBuilderRoot).filter(isEligible);
for (const absolute of eligible) {
  const relative = path.relative(frontendRoot, absolute).split(path.sep).join('/');
  const appRelative = relative.replace('src/AppBuilder/', '');
  const override = manifest.overrides[relative];
  if (override && !subsystemIds.has(override)) errors.push(`Unknown override subsystem for ${relative}: ${override}`);
  const matches = manifest.subsystems.filter(({ roots, files = [] }) =>
    files.includes(appRelative) || roots.some((root) => appRelative === root || appRelative.startsWith(`${root}/`))
  );
  const longest = Math.max(0, ...matches.flatMap(({ roots }) =>
    roots.filter((root) => appRelative === root || appRelative.startsWith(`${root}/`)).map((root) => root.length)
  ));
  const mostSpecific = matches.filter(({ roots, files = [] }) =>
    files.includes(appRelative) || roots.some((root) => root.length === longest)
  );
  const assigned = override || (mostSpecific.length === 1 ? mostSpecific[0].id : null);
  if (!assigned) errors.push(matches.length ? `Ambiguous subsystem roots match ${relative}` : `Unassigned source file: ${relative}`);
  else counts[assigned] += 1;
}

for (const [relative, subsystem] of Object.entries(manifest.overrides)) {
  if (!fs.existsSync(path.join(frontendRoot, relative))) errors.push(`Override points to missing file: ${relative}`);
  if (!subsystemIds.has(subsystem)) errors.push(`Override uses unknown subsystem: ${relative}`);
}
for (const exception of manifest.exceptions) {
  if (!exception.path || /[*?]/.test(exception.path)) errors.push('Coverage exceptions must use exact source paths');
  for (const field of ['edition', 'category', 'rationale', 'evidence', 'accountableRole', 'approver', 'approvalDate', 'reviewDate']) {
    if (!exception[field]) errors.push(`Exception ${exception.path || '<unknown>'} is missing ${field}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ eligibleFiles: eligible.length, subsystemFiles: counts }, null, 2));
