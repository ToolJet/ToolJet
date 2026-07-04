/**
 * Resolution Engine — wired types (Phase 2).
 * Mirrors `docs/appbuilder-resolution-engine/engine-interface.ts` (the design
 * reference); this copy is the one code imports.
 */

/** A path into runtime state, e.g. "components.textinput1.value". The engine
 *  uses the store's existing dotted-string paths so the dependency graph is
 *  shared unchanged. */
export type StatePath = string;

/** Data-only runtime state. Serializable: no functions, no DOM nodes, no class
 *  instances (worker-hostable). */
export type RuntimeState = Record<string, unknown>;

export type EngineCommand =
  | { kind: 'SET_RUNTIME'; path: StatePath; value: unknown }
  | { kind: 'INVOKE_CSA'; componentId: string; action: string; args: unknown[]; rowIndex?: number }
  | { kind: 'FIRE_EVENT'; componentId: string; event: string; rowIndex?: number }
  | { kind: 'SET_VISIBLE_ROWS'; parentId: string; indices: number[] };

export interface UpdateNode {
  path: StatePath;
  value: unknown;
}

export interface EffectIntent {
  componentId: string;
  effect: string;
  args?: unknown[];
  rowIndex?: number;
}

export interface CascadeResult {
  updates: UpdateNode[];
  effects: EffectIntent[];
}

/** Serializable snapshot of the dependency graph — crosses postMessage. */
export interface SerializedGraph {
  /** node path → node data (today: '' or the entity id owning the binding) */
  nodes: Record<string, unknown>;
  /** edge list: [dependencyPath, dependentPath] — "from depends-on to" in
   *  dependency-graph terms (addDependency(from, to): from is re-resolved when to changes). */
  edges: [string, string][];
}

/** An unresolved binding the engine can re-resolve: where it lives + its `{{ }}` code. */
export interface BindingDefinition {
  /** Graph path of the binding, e.g. "components.<id>.properties.text" */
  path: StatePath;
  /** The unresolved expression, e.g. "{{queries.q1.data.total}} rows" */
  code: string;
}
