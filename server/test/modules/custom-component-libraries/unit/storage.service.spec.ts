import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { StorageService } from '@modules/custom-component-libraries/storage.service';

// An in-memory stand-in for the table, answering the service's three statements.
const fakeManager = () => {
  const rows = new Map<string, Buffer>();
  return {
    rows,
    query: jest.fn(async (sql: string, params: any[]) => {
      if (sql.startsWith('INSERT')) rows.set(params[0], params[1]);
      if (sql.startsWith('SELECT')) return rows.has(params[0]) ? [{ data: rows.get(params[0]) }] : [];
      if (sql.startsWith('DELETE')) for (const key of [...rows.keys()]) if (key.startsWith(params[0])) rows.delete(key);
      return [];
    }),
  };
};

describe('StorageService', () => {
  let dir: string;
  let manager: ReturnType<typeof fakeManager>;
  let service: StorageService;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bundles-'));
    process.env.CUSTOM_COMPONENT_STORAGE_PATH = dir;
    manager = fakeManager();
    service = new StorageService(manager as any);
  });

  afterEach(async () => {
    delete process.env.CUSTOM_COMPONENT_STORAGE_PATH;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('keeps uploaded bytes in the database, not on disk', async () => {
    const stored = await service.upload('org/lib/v1/index.js', Buffer.from('code'));
    expect(stored).toBe('org/lib/v1/index.js');
    expect((await service.read('org/lib/v1/index.js')).toString()).toBe('code');
    await expect(fs.access(path.join(dir, 'org/lib/v1/index.js'))).rejects.toThrow();
  });

  it('reads a file left on disk by an earlier version and moves it to the database', async () => {
    await fs.mkdir(path.join(dir, 'org/lib/v1'), { recursive: true });
    await fs.writeFile(path.join(dir, 'org/lib/v1/index.js'), 'old');
    expect((await service.read('org/lib/v1/index.js')).toString()).toBe('old');
    expect(manager.rows.get('org/lib/v1/index.js')?.toString()).toBe('old');
  });

  it('throws ENOENT for a file that is nowhere, which callers map to 404', async () => {
    await expect(service.read('org/lib/v1/missing.js')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('deletes a whole library but not one whose id starts the same', async () => {
    await service.upload('org/lib/v1/index.js', Buffer.from('a'));
    await service.upload('org/lib/dev/u/index.js', Buffer.from('b'));
    await service.upload('org/lib2/v1/index.js', Buffer.from('c'));
    await service.deleteFolder('org/lib');
    expect([...manager.rows.keys()]).toEqual(['org/lib2/v1/index.js']);
  });

  it('refuses a path outside the storage folder', async () => {
    await expect(service.upload('../escape', Buffer.from('x'))).rejects.toThrow('Invalid storage path');
    await expect(service.read('../escape')).rejects.toThrow('Invalid storage path');
  });
});
