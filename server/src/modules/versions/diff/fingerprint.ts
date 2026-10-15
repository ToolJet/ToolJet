import { createHash } from 'crypto';
import { VersionSnapshot } from './types';
import { isEmpty, stable } from './version-diff';

// A hash of what a version contains, independent of row ids and of the
// version's own name and status. Two versions with the same pages,
// components, queries, events and settings share a fingerprint, and any edit
// (by a person or by the AI) changes it. Approvals are bound to it.
//
// The prefix names the algorithm. Changing what counts as content (for example
// which widget defaults are merged in) must bump it, so approvals recorded
// under the old rules can be told apart instead of silently going stale.
//
// f3: empty values are dropped first, the same "missing equals empty" rule
// the diff uses, because the editor writes empty keys (table_name: "") into
// rows just by opening them.
export const FINGERPRINT_VERSION = 'f3';
export function contentFingerprint(snapshot: VersionSnapshot): string {
  const strip = (value: any): any => {
    if (Array.isArray(value)) return value.map(strip);
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const [key, inner] of Object.entries(value)) if (key !== 'id' && !isEmpty(inner)) out[key] = strip(inner);
      return out;
    }
    return value;
  };
  // The version's own id, name and status are not content.
  const content = { ...snapshot };
  delete content.versionId;
  delete content.name;
  delete content.status;
  const sortByKey = (items: Array<{ key: string }>) => [...items].sort((a, b) => a.key.localeCompare(b.key));
  const hash = createHash('sha256')
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
  return `${FINGERPRINT_VERSION}:${hash}`;
}
