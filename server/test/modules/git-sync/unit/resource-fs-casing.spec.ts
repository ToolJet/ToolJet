/**
 * Case-sensitive git serialization: two resources whose names differ only in
 * casing ("Foo" / "foo") must occupy two DISTINCT directories in the repo and be
 * read back as two DISTINCT entries (keyed by co_relation_id / content.id, never
 * by name). Covers all three resource layouts:
 *   - data-sources/<name>/data-source.json   (readDataSourceEntries)
 *   - apps/<name>/app/app.json               (listGitResources 'apps')
 *   - modules/<name>/app/app.json            (listGitResources 'modules')
 *
 * The write side derives the folder from the exact resource name (path.join with
 * the raw name), so this asserts the read side keeps the two directories distinct.
 *
 * NOTE: this relies on a case-sensitive filesystem (as on Linux CI). On a
 * case-insensitive volume (default macOS/Windows) "Foo" and "foo" map to one
 * directory at the OS level — a platform limitation, not a code defect.
 *
 * @group gitsync
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readDataSourceEntries } from '@ee/git-sync/data-source-fs.util';
import { listGitResources } from '@ee/git-sync/git-resource-fs.util';

/**
 * Detect whether the temp filesystem is case-sensitive. On a case-insensitive
 * volume (default macOS/Windows) "Foo" and "foo" are the same directory, so the
 * distinct-directory assertions can't hold — the collapse happens in the OS,
 * below our code. We skip there and log, rather than false-fail; the assertions
 * still run on case-sensitive filesystems (Linux CI).
 */
function detectCaseSensitiveFs(): boolean {
  const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'case-probe-'));
  try {
    fs.mkdirSync(path.join(probe, 'CASECHECK'));
    return !fs.existsSync(path.join(probe, 'casecheck'));
  } finally {
    fs.rmSync(probe, { recursive: true, force: true });
  }
}

const CASE_SENSITIVE_FS = detectCaseSensitiveFs();
const itCS = CASE_SENSITIVE_FS ? it : it.skip;

if (!CASE_SENSITIVE_FS) {
  console.warn(
    '[resource-fs-casing] Skipping distinct-directory assertions: temp filesystem is case-INSENSITIVE ' +
      '(macOS/Windows). Foo/foo cannot be two directories at the OS level here; runs fully on Linux CI.'
  );
}

describe('git serialization — name casing (distinct directories per resource)', () => {
  let repoPath: string;

  beforeEach(() => {
    repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'resource-fs-casing-'));
  });

  afterEach(() => {
    fs.rmSync(repoPath, { recursive: true, force: true });
  });

  const writeDataSource = (folder: string, id: string) => {
    const dir = path.join(repoPath, 'data-sources', folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'data-source.json'), JSON.stringify({ id, name: folder }));
  };

  const writeApp = (resourceFolder: 'apps' | 'modules', folder: string, id: string) => {
    const dir = path.join(repoPath, resourceFolder, folder, 'app');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify({ id, name: folder }));
  };

  itCS('data sources: Foo and foo are two separate directories and two entries', () => {
    writeDataSource('Foo', 'ds-upper');
    writeDataSource('foo', 'ds-lower');

    expect(fs.existsSync(path.join(repoPath, 'data-sources', 'Foo'))).toBe(true);
    expect(fs.existsSync(path.join(repoPath, 'data-sources', 'foo'))).toBe(true);

    const entries = readDataSourceEntries(path.join(repoPath, 'data-sources'));
    const byId = new Map(entries.map((e) => [e.coRelationId, e]));

    expect(entries).toHaveLength(2);
    expect(byId.get('ds-upper')!.content.name).toBe('Foo');
    expect(byId.get('ds-lower')!.content.name).toBe('foo');
  });

  itCS('apps: Foo and foo are two separate directories and two entries', () => {
    writeApp('apps', 'Foo', 'app-upper');
    writeApp('apps', 'foo', 'app-lower');

    const entries = listGitResources(repoPath, 'apps');
    const byId = new Map(entries.map((e) => [e.coRelationId, e]));

    expect(entries).toHaveLength(2);
    expect(byId.get('app-upper')!.name).toBe('Foo');
    expect(byId.get('app-lower')!.name).toBe('foo');
  });

  itCS('modules: Foo and foo are two separate directories and two entries', () => {
    writeApp('modules', 'Foo', 'mod-upper');
    writeApp('modules', 'foo', 'mod-lower');

    const entries = listGitResources(repoPath, 'modules');
    const byId = new Map(entries.map((e) => [e.coRelationId, e]));

    expect(entries).toHaveLength(2);
    expect(byId.get('mod-upper')!.name).toBe('Foo');
    expect(byId.get('mod-lower')!.name).toBe('foo');
  });
});
