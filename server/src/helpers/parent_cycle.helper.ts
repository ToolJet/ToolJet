// Cycle repair for component parent-child trees during import/export, git pull,
// page clone, and template instantiation. A cycle (A.parent=B, B.parent=A, or
// longer) would otherwise be persisted verbatim by the ID remap step and
// freeze the canvas the moment any walker touches it. Repair strategy: detect
// every cycle, pick a deterministic node to break (lex-min id), null its
// parent so it bubbles to canvas root. Other nodes in the former cycle hang
// off the chosen one naturally.

export interface ParentRefComponent {
  id: string;
  parent?: string | null;
}

// Strips the `-<slot>` suffix (e.g. `-tab1`, `-header`, `-modal`) and returns
// the bare component UUID. Mirrors the regex used by the frontend's
// getBaseParentId and the server-side ComponentsService helper.
const extractBaseParentId = (parentId: string | null | undefined): string | null => {
  if (!parentId) return null;
  const match = parentId.match(/([a-fA-F0-9-]{36})-(.+)/);
  return match ? match[1] : parentId;
};

export interface RepairParentCyclesResult {
  repairedIds: string[];
}

export function repairParentCycles<T extends ParentRefComponent>(components: T[]): RepairParentCyclesResult {
  if (!components || components.length === 0) {
    return { repairedIds: [] };
  }

  const parentBaseById = new Map<string, string | null>();
  const componentById = new Map<string, T>();
  components.forEach((c) => {
    componentById.set(c.id, c);
    parentBaseById.set(c.id, extractBaseParentId(c.parent));
  });

  const repairedIds: string[] = [];

  // Sort for determinism — the same input must always pick the same node to
  // break, otherwise re-imports drift.
  const ids = Array.from(parentBaseById.keys()).sort();

  for (const startId of ids) {
    if (parentBaseById.get(startId) === null) continue;

    const visited = new Set<string>();
    const path: string[] = [];
    let current: string | null = startId;

    while (current) {
      if (!parentBaseById.has(current)) break; // walked off the known graph
      if (visited.has(current)) {
        // Cycle. Members are the slice of path from the first occurrence of
        // `current` to the end, plus `current` itself implicitly.
        const cycleStart = path.indexOf(current);
        const cycleMembers = path.slice(cycleStart);
        const chosen = [...cycleMembers].sort()[0];
        parentBaseById.set(chosen, null);
        const comp = componentById.get(chosen);
        if (comp) {
          comp.parent = null;
        }
        repairedIds.push(chosen);
        break;
      }
      visited.add(current);
      path.push(current);
      current = parentBaseById.get(current) ?? null;
    }
  }

  return { repairedIds };
}
