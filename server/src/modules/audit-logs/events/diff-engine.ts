import { isEqual } from 'lodash';
import { AuditChanges, FieldSpec, Snapshot } from './types';

/**
 * Field-level diff between two snapshots of the same resource.
 * - before = null (create): every field from null.
 * - after = null (delete): every field to null.
 * - otherwise: only fields whose value changed.
 * Returns null when nothing changed, which means "write no event" for updates.
 */
export function diffSnapshots(before: Snapshot | null, after: Snapshot | null, fields: FieldSpec): AuditChanges | null {
  if (!before && !after) return null;

  const changes: AuditChanges = {};
  for (const [field, kind] of Object.entries(fields)) {
    const from = before ? (before[field] ?? null) : null;
    const to = after ? (after[field] ?? null) : null;
    if (isEqual(from, to)) continue;
    changes[field] = kind === 'sensitive' ? { changed: true } : { from, to };
  }

  return Object.keys(changes).length ? changes : null;
}
