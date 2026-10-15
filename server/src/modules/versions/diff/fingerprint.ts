import { createHash } from 'crypto';
import { VersionSnapshot } from './types';
import { stable } from './version-diff';

// A hash of what a version contains, independent of row ids and of the
// version's own name and status. Two versions with the same pages,
// components, queries, events and settings share a fingerprint, and any edit
// (by a person or by the AI) changes it. Approvals are bound to it.
export function contentFingerprint(snapshot: VersionSnapshot): string {
  const strip = (value: any): any => {
    if (Array.isArray(value)) return value.map(strip);
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [key, inner] of Object.entries(value)) if (key !== 'id') out[key] = strip(inner);
      return out;
    }
    return value;
  };
  const { versionId, name, status, ...content } = snapshot;
  const sortByKey = (items: Array<{ key: string }>) => [...items].sort((a, b) => a.key.localeCompare(b.key));
  return createHash('sha256')
    .update(
      stable(
        strip({
          ...content,
          components: sortByKey(content.components),
          queries: sortByKey(content.queries),
          events: sortByKey(content.events),
        })
      )
    )
    .digest('hex');
}
