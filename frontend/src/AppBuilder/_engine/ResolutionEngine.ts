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
import type { BindingDefinition, CascadeResult, EngineCommand, RuntimeState, SerializedGraph, StatePath, UpdateNode } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EngineInit {
  graph: SerializedGraph;
  bindings: BindingDefinition[];
  seedState?: RuntimeState;
}

export class ResolutionEngine {
  private runtimeState: RuntimeState = {};
  private graph: any = null;
  private bindings = new Map<StatePath, string>();

  init({ graph, bindings, seedState }: EngineInit): void {
    this.graph = deserializeGraph(graph);
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

  /** Re-resolve every known binding against current state — full recompute.
   *  Used by the shadow-diff to compare engine output with the live store's
   *  incrementally built resolvedStore. */
  resolveAllBindings(): UpdateNode[] {
    const updates: UpdateNode[] = [];
    for (const [path, code] of this.bindings) {
      updates.push({ path, value: resolveDynamicValues(code, this.runtimeState, {}, false, []) });
    }
    return updates;
  }

  /** Resolve one expression against current engine state (CodeHinter preview path). */
  resolveExpression(code: string, customObjects: Record<string, unknown> = {}): unknown {
    return resolveDynamicValues(code, this.runtimeState, customObjects, false, []);
  }

  applyCommands(commands: EngineCommand[]): CascadeResult {
    const updates: UpdateNode[] = [];
    for (const command of commands) {
      if (command.kind === 'SET_RUNTIME') {
        _.set(this.runtimeState, command.path, command.value);
        updates.push({ path: command.path, value: command.value });
        this.cascadeFrom(command.path, updates, new Set([command.path]));
      }
      // INVOKE_CSA / FIRE_EVENT / SET_VISIBLE_ROWS: Phase 3 (per-type contracts).
    }
    return { updates, effects: [] };
  }

  /** Re-resolve everything that (transitively) depends on `changedPath`.
   *  Mirrors the store cascade: affected order comes from the graph; a resolved
   *  binding is written back into state so chained dependents observe it. */
  private cascadeFrom(changedPath: StatePath, updates: UpdateNode[], visited: Set<string>): void {
    if (!this.graph) return;
    const affected: string[] = this.graph.getDependencies(changedPath);
    for (const path of affected) {
      if (visited.has(path)) continue;
      visited.add(path);
      const code = this.bindings.get(path);
      if (code === undefined) continue; // structural node (base/data path), nothing to resolve
      const value = resolveDynamicValues(code, this.runtimeState, {}, false, []);
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
