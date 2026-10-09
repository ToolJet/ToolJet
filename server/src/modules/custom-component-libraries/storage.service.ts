import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

// Bundle byte storage for custom component libraries (DECISIONS-2026-07-30 #1):
// filesystem now, S3/MinIO added inside this same class when cloud needs it.
// Layout: {baseDir}/{orgId}/{libraryId}/{v1|dev/{userId}}/index.js|index.css|manifest.json
// ponytail: single fs implementation, no provider interface — add the S3 branch when it's real.
@Injectable()
export class StorageService {
  private readonly baseDir = process.env.CUSTOM_COMPONENT_STORAGE_PATH || '/data/custom-components';

  // All paths are server-generated (uuids + versions we mint), but the traversal guard is cheap
  // and this sits next to a trust boundary (uploaded bytes) — keep it.
  private resolveSafe(relativePath: string): string {
    const full = path.resolve(this.baseDir, relativePath);
    if (!full.startsWith(path.resolve(this.baseDir) + path.sep)) {
      throw new Error(`Invalid storage path: ${relativePath}`);
    }
    return full;
  }

  /** Writes bytes, creating parent dirs. Returns the relative path (what we store as bundle_url). */
  async upload(relativePath: string, data: Buffer): Promise<string> {
    const full = this.resolveSafe(relativePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return relativePath;
  }

  /** Reads bytes. Throws ENOENT if missing — callers map to 404. */
  async read(relativePath: string): Promise<Buffer> {
    return fs.readFile(this.resolveSafe(relativePath));
  }

  /** Recursively deletes a folder (no-op if absent). One call cleans a whole library. */
  async deleteFolder(relativePath: string): Promise<void> {
    await fs.rm(this.resolveSafe(relativePath), { recursive: true, force: true });
  }
}
