import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadBuiltinPacks, readBuiltinPackFile } from 'src/modules/builtin-packs/builtin-packs';

// A release folder as the build step writes it: builtin-packs/<pack>/{builtin.json, manifest.json, index.js, index.css}.
const writePack = (root: string, pack: string, files: Record<string, string>) => {
  fs.mkdirSync(path.join(root, pack), { recursive: true });
  for (const [name, contents] of Object.entries(files)) fs.writeFileSync(path.join(root, pack, name), contents);
};

const shadcn = {
  'builtin.json': JSON.stringify({ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31' }),
  'manifest.json': JSON.stringify({ components: { Button: { props: [] } } }),
  'index.js': 'export const Button = () => null;',
  'index.css': '.ui-btn{}',
};

describe('built-in packs', () => {
  let root: string;
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'builtin-packs-'));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('lists each pack in the release folder with its version and a content hash', () => {
    writePack(root, 'shadcn', shadcn);

    const packs = loadBuiltinPacks(root);

    expect(packs).toHaveLength(1);
    expect(packs[0]).toMatchObject({ pack: 'shadcn', displayName: 'shadcn', version: '2.1.31', hasCss: true });
    expect(packs[0].hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('gives a new hash when the pack content changes, so browsers fetch the new files after an upgrade', () => {
    writePack(root, 'shadcn', shadcn);
    const before = loadBuiltinPacks(root)[0].hash;

    writePack(root, 'shadcn', { 'index.js': 'export const Button = () => "v2";' });

    expect(loadBuiltinPacks(root)[0].hash).not.toBe(before);
  });

  it('lists nothing when the server ships without packs, and skips folders that are not a pack', () => {
    expect(loadBuiltinPacks(path.join(root, 'missing'))).toEqual([]);

    writePack(root, 'notes', { 'README.md': 'not a pack' });
    expect(loadBuiltinPacks(root)).toEqual([]);
  });

  it("serves a pack's files only at its current hash", () => {
    writePack(root, 'shadcn', shadcn);
    const packs = loadBuiltinPacks(root);
    const { hash } = packs[0];

    expect(readBuiltinPackFile(root, packs, 'shadcn', hash, 'index.js')?.toString()).toBe(shadcn['index.js']);
    expect(readBuiltinPackFile(root, packs, 'shadcn', hash, 'manifest.json')?.toString()).toBe(shadcn['manifest.json']);
    expect(readBuiltinPackFile(root, packs, 'shadcn', 'stale0000000000', 'index.js')).toBeNull();
  });

  it.each([
    ['an unknown pack', 'antd', 'index.js'],
    ['a file outside the pack', 'shadcn', '../../etc/passwd'],
    ['a file the pack does not ship', 'shadcn', 'builtin.json'],
  ])('serves nothing for %s', (_label, pack, file) => {
    writePack(root, 'shadcn', shadcn);
    const packs = loadBuiltinPacks(root);

    expect(readBuiltinPackFile(root, packs, pack, packs[0].hash, file)).toBeNull();
  });
});
