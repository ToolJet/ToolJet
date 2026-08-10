import { Layout } from '@entities/layout.entity';

/**
 * Deduplicates an array of layouts by `type` (e.g. 'desktop', 'mobile'),
 * keeping the entry with the latest `updatedAt` for each type.
 * When timestamps are equal, uses `id` as a deterministic tiebreaker
 * (lexicographically greatest UUID wins) to ensure stable selection
 * regardless of array/query order.
 *
 * This prevents duplicate layout rows from being propagated during
 * version fork, page clone, and import operations.
 */
export function deduplicateLayoutsByType<T extends Pick<Layout, 'type'> & { id?: string; updatedAt?: Date | string }>(
  layouts: T[]
): T[] {
  const byType = new Map<string, T>();
  for (const layout of layouts) {
    const existing = byType.get(layout.type);
    if (!existing) {
      byType.set(layout.type, layout);
    } else {
      const currTime = layout.updatedAt ? new Date(layout.updatedAt).getTime() : 0;
      const existTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      if (currTime > existTime || (currTime === existTime && (layout.id ?? '') > (existing.id ?? ''))) {
        byType.set(layout.type, layout);
      }
    }
  }
  return Array.from(byType.values());
}
