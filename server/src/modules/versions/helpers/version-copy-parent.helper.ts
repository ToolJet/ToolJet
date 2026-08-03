/**
 * Parent remapping when copying/re-creating an app version.
 *
 * Each component gets a new UUID; `parent` must be updated to match. Resolution order:
 *
 * 1. Parent is in idMap (old component id → new id) → use the mapped id
 *    (composite parents like `{tabsId}-t2` remap the base id and keep the suffix)
 * 2. Parent is a "ghost" (UUID not on the page, e.g. legacy subcontainer ids) → keep the
 *    original parent string so the editor keeps the same grouping as the source version
 * 3. Otherwise → null (main canvas)
 *
 * Components whose parent starts with "undefined" are skipped entirely (corrupt data).
 */
/**
 * Checks if a string looks like a component UUID, e.g. `b7ec3a43-f7a0-4ab9-ab7f-e07a7b7bc249`.
 * Pattern: 8 hex chars, dash, 4, dash, 4, dash, 4, dash, 12 (letters a–f and digits 0–9 only).
 * Used so we only preserve unknown parents that look like real ids—not random text.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseParentIdAndSuffix(parentId: string) {
  const match = parentId?.match(/([a-fA-F0-9-]{36})-(.+)/);
  return match ? { baseId: match[1], suffix: match[2] } : { baseId: parentId || null, suffix: null };
}

/** Skip components with corrupt parents (e.g. `undefined-t0`). */
export function shouldSkipComponentOnVersionCopy(component: { parent?: string | null }) {
  return !!component.parent?.startsWith('undefined');
}

function isGhostParent(parentId: string, validComponentIds: Set<string>) {
  if (!parentId || parentId === 'canvas-header' || parentId === 'canvas-footer') {
    return false;
  }

  const { baseId, suffix } = parseParentIdAndSuffix(parentId);
  if (!baseId || validComponentIds.has(baseId)) {
    return false;
  }

  return suffix ? true : UUID_RE.test(parentId);
}

/**
 * Remap parent on version copy. Preserves legacy ghost parent ids instead of setting null (canvas).
 */
export function remapParentIdForVersionCopy(
  parentId: string,
  idMap: Record<string, string>,
  validComponentIds: Set<string>,
  suffix?: string
): string | null {
  const { baseId, suffix: parsedSuffix } = parseParentIdAndSuffix(parentId);
  const compositeSuffix = suffix ?? parsedSuffix;

  if (compositeSuffix && baseId) {
    const newBaseId = idMap[baseId];
    if (newBaseId) {
      return `${newBaseId}-${compositeSuffix}`;
    }
    return isGhostParent(parentId, validComponentIds) ? parentId : null;
  }

  return idMap[parentId] ?? (isGhostParent(parentId, validComponentIds) ? parentId : null);
}

/**
 * Remap a FlexContainer's `childOrder` (an array of child component ids) on version copy.
 *
 * Each child gets a new UUID during the copy, but `childOrder` is stored as raw ids in
 * `properties` and is not a `{{...}}` binding, so `updateEntityReferences` never touches it.
 * Left unmapped, every id becomes stale and the editor drops the saved order, falling back
 * to insertion order (issue #5153). Also used by app import/export
 * (`updateEntityReferencesForImportedApp`) and page clone (`clonePageEventsAndComponents`).
 * Mapped ids are replaced in place to preserve order; unknown ids are left untouched.
 *
 * Returns true when at least one id was remapped.
 */
export function remapFlexContainerChildOrder(
  component: { properties?: { childOrder?: { value?: unknown } } },
  idMap: Record<string, string>
): boolean {
  const childOrder = component?.properties?.childOrder?.value;
  if (!Array.isArray(childOrder)) return false;

  let changed = false;
  const remapped = childOrder.map((childId) => {
    const newId = idMap[childId as string];
    if (newId && newId !== childId) {
      changed = true;
      return newId;
    }
    return childId;
  });

  if (changed) {
    component.properties.childOrder.value = remapped;
  }
  return changed;
}
