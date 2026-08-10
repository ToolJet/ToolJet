import { Layout } from '@entities/layout.entity';

/**
 * Deduplicates an array of layouts by `type` (e.g. 'desktop', 'mobile'),
 * keeping the entry with the latest `updatedAt` for each type.
 *
 * This prevents duplicate layout rows from being propagated during
 * version fork, page clone, and import operations.
 */
export function deduplicateLayoutsByType<T extends Pick<Layout, 'type'> & { updatedAt?: Date }>(layouts: T[]): T[] {
  const byType = new Map<string, T>();
  for (const layout of layouts) {
    const existing = byType.get(layout.type);
    if (!existing) {
      byType.set(layout.type, layout);
    } else if (layout.updatedAt && (!existing.updatedAt || layout.updatedAt >= existing.updatedAt)) {
      byType.set(layout.type, layout);
    }
  }
  return Array.from(byType.values());
}
