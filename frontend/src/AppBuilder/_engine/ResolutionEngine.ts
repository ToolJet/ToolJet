/**
 * ResolutionEngine (Phase 2, first slice) — a pure, headless-testable reducer
 * that owns: runtime state snapshot, the dependency graph, unresolved bindings,
 * and the re-resolution cascade. Commands in → UpdateNode diffs out.
 *
 * Purity contract: no React, no DOM, no `window`, no Zustand. Hostable on the
 * main thread today and in a Web Worker later with only the host changing.
 *
 * Scope of this slice: SET_RUNTIME + cascade over the (deserialized) store
 * graph, using the same resolver and the same cascade direction the store uses
 * (`dependenciesOf(changedPath)` — see componentsSlice.updateDependencyValues).
 * INVOKE_CSA / FIRE_EVENT / SET_VISIBLE_ROWS land with Phase 3 contracts.
 */
import _ from 'lodash';
import { resolveDynamicValues } from './resolver';
import { deserializeGraph } from './graphSerializer';
import { getContract } from './contracts';
import type {
  BindingDefinition,
  CascadeResult,
  EffectIntent,
  EngineCommand,
  RuntimeState,
  SerializedGraph,
  StatePath,
  UpdateNode,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Sentinel returned for a row-scoped binding's row when the overlay hit a
 *  descendant with no data for that row at all (not even a Bucket-A default
 *  — see resolveRowScoped's comment). The engine's runtimeState is seeded
 *  via getAllExposedValues(moduleId, { raw: true }), which deliberately
 *  bypasses the store's lazy-ListView-read Proxy (cloneDeep can't traverse
 *  a live Proxy) — so for a row that never mounted, the engine's seed has
 *  no entry at all where the store's Proxy would compute one on read. There
 *  is no cheap way to replicate that fallback here (it needs the target
 *  descendant's resolved properties + its contract's deriveExposed, neither
 *  of which the engine currently has seeded) — so this row is reported as
 *  "can't resolve" rather than silently resolving against `{}` and risking
 *  a confidently wrong value. Callers (engineBridge.ts/shadow.ts) must skip
 *  comparing rows that come back as this sentinel instead of treating them
 *  as a divergence. */
export const ROW_UNRESOLVABLE = Symbol('row-unresolvable');

/** One overlay per row-scoped parent, built once and reused across all of
 *  that parent's descendant bindings within one resolution pass — mirrors
 *  the store's buildRowScopedState/prepareRowScope reuse (componentsSlice.js/
 *  listViewComponentSlice.js). Unlike the store's version, no
 *  Object.defineProperty workaround is needed: the engine's runtimeState is
 *  a plain cloned object, never Immer-frozen, so plain assignment on the
 *  overlay's own properties is always legal. */
interface RowScopeOverlay {
  scoped: Record<string, unknown>;
  descendantIds: string[];
  components: Record<string, unknown>;
}

export interface EngineInit {
  graph: SerializedGraph;
  bindings: BindingDefinition[];
  seedState?: RuntimeState;
  /** componentId → component type, for INVOKE_CSA contract lookup. */
  componentTypes?: Record<string, string>;
  /* ── Row-scoped resolution (ListView/Kanban/Table) — all cheaply derived
     from existing store state at seed time, see engineBridge.ts. Mirrors
     the store's own row-scoped mechanism (prepareRowScope/updateRowScope +
     getCustomResolvables + isLazyResolvableParent/getLazyRowIndices). ── */
  /** componentId → nearest row-scoped ancestor id (ListView/Kanban/Table),
   *  for every descendant of such an ancestor. Mirrors
   *  findNearestSubcontainerAncestor, computed once at seed time instead of
   *  walked per lookup — the engine has no live component tree to walk. */
  rowScopedParentOf?: Record<string, string>;
  /** containerId → direct child component ids. Mirrors the store's own
   *  containerChildrenMapping; used to find a row-scoped parent's full
   *  descendant set (recursively), same as prepareRowScope's walk. */
  containerChildrenMapping?: Record<string, string[]>;
  /** row-scoped parent id → per-row custom-resolvable object (already
   *  shaped like the store's own customResolvables entries, e.g.
   *  `{ listItem: row }` / `{ rowData: row }` / `{ cardData: row }` —
   *  passed straight through as resolveDynamicValues' customObjects arg). */
  customResolvables?: Record<string, Record<string, unknown>[]>;
  /** row-scoped parent id → 'listItem' | 'rowData' | 'cardData'. Not read
   *  by the resolution logic itself (customResolvables is already
   *  pre-shaped) — kept for diagnostics/future use. */
  resolvableKeyOf?: Record<string, string>;
  /** row-scoped parent id → currently-lazy row indices, when that parent is
   *  lazy-resolvable (mirrors isLazyResolvableParent/getLazyRowIndices).
   *  Absent/no entry → resolve every row (0..customResolvables[id].length-1),
   *  matching the store's own non-lazy default. */
  lazyRowIndicesOf?: Record<string, number[]>;
}

export class ResolutionEngine {
  private runtimeState: RuntimeState = {};
  private graph: any = null;
  private bindings = new Map<StatePath, string>();
  private componentTypes: Record<string, string> = {};
  private rowScopedParentOf: Record<string, string> = {};
  private containerChildrenMapping: Record<string, string[]> = {};
  private customResolvables: Record<string, Record<string, unknown>[]> = {};
  private lazyRowIndicesOf: Record<string, number[]> = {};

  init({
    graph,
    bindings,
    seedState,
    componentTypes,
    rowScopedParentOf,
    containerChildrenMapping,
    customResolvables,
    lazyRowIndicesOf,
  }: EngineInit): void {
    this.graph = deserializeGraph(graph);
    this.componentTypes = componentTypes ?? {};
    this.rowScopedParentOf = rowScopedParentOf ?? {};
    this.containerChildrenMapping = containerChildrenMapping ?? {};
    this.customResolvables = customResolvables ?? {};
    this.lazyRowIndicesOf = lazyRowIndicesOf ?? {};
    this.bindings = new Map(bindings.map((b) => [b.path, b.code]));
    // The store persists each binding's unresolved expression as graph node
    // data (DependencyClass.addDependency → setNodeData), so the serialized
    // graph is self-describing — derive bindings from it directly.
    for (const [path, data] of Object.entries(graph.nodes)) {
      if (!this.bindings.has(path) && typeof data === 'string' && data.includes('{{')) {
        this.bindings.set(path, data);
      }
    }
    this.runtimeState = seedState ? _.cloneDeep(seedState) : {};
  }

  /** Refreshes ONLY the row-scoped seed fields, leaving runtimeState/graph/
   *  bindings untouched. These change far more often than the structural
   *  graph/bindings this engine mirrors (e.g. every scroll tick grows the
   *  live store's lazyRowIndices) — a host doing incremental shadow
   *  comparison (engineBridge.ts) should call this before each cascade
   *  rather than re-`init()`ing (which would also reset runtimeState). */
  updateRowScopedSeed({
    rowScopedParentOf,
    containerChildrenMapping,
    customResolvables,
    lazyRowIndicesOf,
  }: Pick<
    EngineInit,
    'rowScopedParentOf' | 'containerChildrenMapping' | 'customResolvables' | 'lazyRowIndicesOf'
  >): void {
    if (rowScopedParentOf) this.rowScopedParentOf = rowScopedParentOf;
    if (containerChildrenMapping) this.containerChildrenMapping = containerChildrenMapping;
    if (customResolvables) this.customResolvables = customResolvables;
    if (lazyRowIndicesOf) this.lazyRowIndicesOf = lazyRowIndicesOf;
  }

  /** Builds the row-scope overlay for one row-scoped parent (ListView/
   *  Kanban/Table) — mirrors prepareRowScope's recursive descendant walk. */
  private buildRowScopeOverlay(parentId: string): RowScopeOverlay | null {
    const components = (this.runtimeState.components ?? {}) as Record<string, unknown>;
    const descendantIds: string[] = [];
    const collect = (containerId: string) => {
      for (const childId of this.containerChildrenMapping[containerId] ?? []) {
        descendantIds.push(childId);
        collect(childId);
      }
    };
    collect(parentId);
    if (descendantIds.length === 0) return null;

    const scoped = Object.create(components) as Record<string, unknown>;
    for (const id of descendantIds) scoped[id] = {};
    return { scoped, descendantIds, components };
  }

  /** Mirrors updateRowScope: mutates the overlay in place for one row.
   *  Returns false if any descendant has no data at all for this row (an
   *  unmounted/never-lazily-materialized row) — see ROW_UNRESOLVABLE. */
  private updateRowScopeOverlay(overlay: RowScopeOverlay, rowIndex: number): boolean {
    let complete = true;
    for (const id of overlay.descendantIds) {
      const value = overlay.components[id];
      if (!Array.isArray(value)) continue;
      const rowValue = value[rowIndex];
      if (rowValue === undefined) complete = false;
      overlay.scoped[id] = rowValue ?? {};
    }
    return complete;
  }

  /** Resolves `code` once per row for a row-scoped binding, returning an
   *  array (mirrors the store's own array-shaped resolvedStore.components[id]
   *  for row-scoped children) — or null if `path` isn't row-scoped at all,
   *  so callers fall back to the ordinary single-value resolve. A row whose
   *  overlay was incomplete (see updateRowScopeOverlay) resolves to
   *  ROW_UNRESOLVABLE instead of guessing against a `{}` stand-in for the
   *  missing descendant — conservative (may skip rows a full Bucket-A
   *  replication could actually resolve), but avoids reporting a
   *  confidently wrong value as a real divergence.
   *  `overlayCache` lets multiple bindings under the same parent within one
   *  resolveAllBindings()/cascadeFrom() pass reuse one overlay build, same
   *  as the store's buildRowScopedState reuse across a whole cascade. */
  private resolveRowScoped(
    path: StatePath,
    code: string,
    overlayCache: Map<string, RowScopeOverlay | null>
  ): unknown[] | null {
    const componentId = path.split('.')[1];
    const parentId = this.rowScopedParentOf[componentId];
    if (!parentId) return null;

    if (!overlayCache.has(parentId)) overlayCache.set(parentId, this.buildRowScopeOverlay(parentId));
    const overlay = overlayCache.get(parentId) ?? null;

    const rows = this.customResolvables[parentId] ?? [];
    const rowIndices = this.lazyRowIndicesOf[parentId] ?? rows.map((_row, i) => i);

    const values: unknown[] = [];
    for (const i of rowIndices) {
      const complete = overlay ? this.updateRowScopeOverlay(overlay, i) : true;
      if (!complete) {
        values[i] = ROW_UNRESOLVABLE;
        continue;
      }
      const scopedState = overlay ? { ...this.runtimeState, components: overlay.scoped } : this.runtimeState;
      values[i] = resolveDynamicValues(code, scopedState, rows[i] ?? {}, false, []);
    }
    return values;
  }

  /** Re-resolve every known binding against current state — full recompute.
   *  Used by the shadow-diff to compare engine output with the live store's
   *  incrementally built resolvedStore. Row-scoped bindings resolve to an
   *  array (one value per currently-resolvable row), matching the store's
   *  own shape, instead of the shadow-diff having to skip them. */
  resolveAllBindings(): UpdateNode[] {
    const updates: UpdateNode[] = [];
    const overlayCache = new Map<string, RowScopeOverlay | null>();
    for (const [path, code] of this.bindings) {
      const rowValues = this.resolveRowScoped(path, code, overlayCache);
      const value = rowValues ?? resolveDynamicValues(code, this.runtimeState, {}, false, []);
      updates.push({ path, value });
    }
    return updates;
  }

  /** Resolve one expression against current engine state (CodeHinter preview path). */
  resolveExpression(code: string, customObjects: Record<string, unknown> = {}): unknown {
    return resolveDynamicValues(code, this.runtimeState, customObjects, false, []);
  }

  applyCommands(commands: EngineCommand[]): CascadeResult {
    const updates: UpdateNode[] = [];
    const effects: EffectIntent[] = [];
    for (const command of commands) {
      if (command.kind === 'SET_RUNTIME') {
        _.set(this.runtimeState, command.path, command.value);
        updates.push({ path: command.path, value: command.value });
        this.cascadeFrom(command.path, updates, new Set([command.path]));
      } else if (command.kind === 'INVOKE_CSA') {
        this.invokeCsa(command, updates, effects);
      }
      // FIRE_EVENT / SET_VISIBLE_ROWS: later Phase 3/4 slices.
    }
    return { updates, effects };
  }

  /** Bucket B: static per-type reducer mutates runtime state and cascades.
   *  Bucket C: emit an EffectIntent for the mounted widget's ref to execute. */
  private invokeCsa(
    command: Extract<EngineCommand, { kind: 'INVOKE_CSA' }>,
    updates: UpdateNode[],
    effects: EffectIntent[]
  ): void {
    const { componentId, action, args, rowIndex } = command;
    const type = this.componentTypes[componentId];
    const contract = type ? getContract(type) : undefined;
    if (contract?.effectActions?.includes(action)) {
      effects.push({ componentId, effect: action, args, rowIndex });
      return;
    }
    const reducer = contract?.stateActions?.[action];
    if (!reducer) return; // unknown action/type — host handles or ignores

    // Row-scoped components (ListView/Kanban/Table descendants) store an
    // array at components.<id> — one entry per row, mirroring the store's
    // own resolvedStore.components[id] shape — rowIndex (declared on
    // EngineCommand since Phase 3, previously read but never used here)
    // picks which row's entry the reducer reads/patches. Without this, a
    // CSA fired for one row would read/write the bare (non-array) object,
    // colliding every row's state into one shared value.
    const isRowScoped = rowIndex !== undefined && componentId in this.rowScopedParentOf;
    const basePath = isRowScoped ? ['components', componentId, rowIndex] : ['components', componentId];
    const current = (_.get(this.runtimeState, basePath) ?? {}) as Record<string, unknown>;
    const patch = reducer(current, args);
    for (const [key, value] of Object.entries(patch)) {
      // The reported/mutation path includes the row index (lodash _.set
      // supports numeric path segments as array indices) — it's the actual
      // thing that changed. The cascade trigger uses the FLAT path instead:
      // the dependency graph's node naming has no row dimension (only the
      // VALUE at that node does), so dependents re-resolve via the
      // row-aware branch in cascadeFrom, not a row-specific graph lookup
      // that wouldn't exist.
      const path = isRowScoped ? `components.${componentId}.${rowIndex}.${key}` : `components.${componentId}.${key}`;
      _.set(this.runtimeState, path, value);
      updates.push({ path, value });
      const cascadePath = isRowScoped ? `components.${componentId}.${key}` : path;
      this.cascadeFrom(cascadePath, updates, new Set([cascadePath]));
    }
  }

  /** For a row-scoped component's exposed value changing (trigger path like
   *  `components.<id>.value`): the dependency graph's node naming has no row
   *  dimension (only the VALUE at that node does), so a plain SET_RUNTIME
   *  would `_.set` a bogus flat `.value` onto the per-row ARRAY living at
   *  that path — corrupting nothing numeric, but never updating the row
   *  that actually changed either (every dependent would keep resolving
   *  against the stale/old per-row entries). The host already holds the
   *  live, current whole array (getAllExposedValues) — replacing it here
   *  wholesale is the correct source of truth for every row, not just the
   *  one that changed — then cascade from the ORIGINAL flat path, which the
   *  graph does recognize. */
  syncRowScopedArrayAndCascade(componentId: string, wholeArray: unknown, triggerPath: StatePath): UpdateNode[] {
    const updates: UpdateNode[] = [];
    _.set(this.runtimeState, ['components', componentId], wholeArray);
    this.cascadeFrom(triggerPath, updates, new Set([triggerPath]));
    return updates;
  }

  /** Re-resolve everything that (transitively) depends on `changedPath`.
   *  Mirrors the store cascade: affected order comes from the graph; a resolved
   *  binding is written back into state so chained dependents observe it.
   *  Row-scoped dependents resolve to an array, same as resolveAllBindings. */
  private cascadeFrom(changedPath: StatePath, updates: UpdateNode[], visited: Set<string>): void {
    if (!this.graph) return;
    const affected: string[] = this.graph.getDependencies(changedPath);
    const overlayCache = new Map<string, RowScopeOverlay | null>();
    for (const path of affected) {
      if (visited.has(path)) continue;
      visited.add(path);
      const code = this.bindings.get(path);
      if (code === undefined) continue; // structural node (base/data path), nothing to resolve
      const rowValues = this.resolveRowScoped(path, code, overlayCache);
      const value = rowValues ?? resolveDynamicValues(code, this.runtimeState, {}, false, []);
      _.set(this.runtimeState, path, value);
      updates.push({ path, value });
    }
  }

  getState(): Readonly<RuntimeState> {
    return this.runtimeState;
  }

  /** All graph paths (transitively) affected by a change — including
   *  structural/sentinel nodes the cascade itself skips. Diagnostics. */
  getAffectedPaths(path: StatePath): StatePath[] {
    return this.graph ? this.graph.getDependencies(path) : [];
  }

  hasBinding(path: StatePath): boolean {
    return this.bindings.has(path);
  }

  /** Bindings the engine knows how to re-resolve (diagnostics/shadow-diff). */
  getBindingPaths(): StatePath[] {
    return [...this.bindings.keys()];
  }
}
