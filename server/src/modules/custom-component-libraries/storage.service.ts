import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { EntityManager } from 'typeorm';

// Bundle byte storage for custom component libraries, in the database: a container's disk does not survive a redeploy.
// Layout of a path: {orgId}/{libraryId}/{v1|dev/{userId}}/index.js|index.css|manifest.json
// Files written to disk by earlier versions are still read from there, and move to the database on first read.
@Injectable()
export class StorageService {
  private readonly baseDir = process.env.CUSTOM_COMPONENT_STORAGE_PATH || '/data/custom-components';

  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  // All paths are server-generated (uuids + versions we mint), but the traversal guard is cheap
  // and this sits next to a trust boundary (uploaded bytes) — keep it.
  private resolveSafe(relativePath: string): string {
    const full = path.resolve(this.baseDir, relativePath);
    if (!full.startsWith(path.resolve(this.baseDir) + path.sep)) {
      throw new Error(`Invalid storage path: ${relativePath}`);
    }
    return full;
  }

  private async save(relativePath: string, data: Buffer): Promise<void> {
    await this.manager.query(
      `INSERT INTO custom_component_bundle_files (path, data, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [relativePath, data]
    );
  }

  /** Writes bytes. Returns the relative path (what we store as bundle_url). */
  async upload(relativePath: string, data: Buffer): Promise<string> {
    this.resolveSafe(relativePath);
    await this.save(relativePath, data);
    return relativePath;
  }

  /** Reads bytes. Throws ENOENT if missing — callers map to 404. */
  async read(relativePath: string): Promise<Buffer> {
    const full = this.resolveSafe(relativePath);
    const rows = await this.manager.query('SELECT data FROM custom_component_bundle_files WHERE path = $1', [
      relativePath,
    ]);
    if (rows.length) return rows[0].data;
    const data = await fs.readFile(full);
    await this.save(relativePath, data);
    return data;
  }

  /** Deletes everything under a folder (no-op if absent). One call cleans a whole library. */
  async deleteFolder(relativePath: string): Promise<void> {
    const full = this.resolveSafe(relativePath);
    await this.manager.query('DELETE FROM custom_component_bundle_files WHERE left(path, length($1)) = $1', [
      `${relativePath}/`,
    ]);
    await fs.rm(full, { recursive: true, force: true });
  }
}
