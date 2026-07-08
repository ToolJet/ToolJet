/**
 * Web Worker entry point — Phase 5 (worker-hosted shadow engine).
 *
 * Hosts the same ResolutionEngine class used by the main-thread continuous
 * shadow (engineBridge.ts), keyed by moduleId exactly like that file's own
 * session.engines map. Nothing outside this worker reads its output yet —
 * workerEngineBridge.ts only diffs it against the store for validation.
 *
 * `resolveAllBindings()` is deliberately NOT exposed: it can return the
 * ROW_UNRESOLVABLE symbol sentinel, which doesn't survive structured clone
 * across the worker boundary as an equatable value. The continuous-shadow
 * path this worker serves never calls it.
 */
import * as Comlink from 'comlink';
import { ResolutionEngine } from './ResolutionEngine';
import type { EngineInit } from './ResolutionEngine';
import type { EngineCommand, CascadeResult, UpdateNode, StatePath } from './types';
import type { RowScopedEngineSeed } from './rowScopedShadow';

const engines = new Map<string, ResolutionEngine>();

const api = {
  initEngine(moduleId: string, init: EngineInit): void {
    const engine = new ResolutionEngine();
    engine.init(init);
    engines.set(moduleId, engine);
  },

  hasEngine(moduleId: string): boolean {
    return engines.has(moduleId);
  },

  updateRowScopedSeed(moduleId: string, seed: RowScopedEngineSeed): void {
    engines.get(moduleId)?.updateRowScopedSeed(seed);
  },

  applyCommands(moduleId: string, commands: EngineCommand[]): CascadeResult | null {
    return engines.get(moduleId)?.applyCommands(commands) ?? null;
  },

  syncRowScopedArrayAndCascade(
    moduleId: string,
    componentId: string,
    wholeArray: unknown,
    triggerPath: StatePath
  ): UpdateNode[] | null {
    const engine = engines.get(moduleId);
    if (!engine) return null;
    return engine.syncRowScopedArrayAndCascade(componentId, wholeArray, triggerPath);
  },

  invalidate(moduleId?: string): void {
    if (moduleId) engines.delete(moduleId);
    else engines.clear();
  },
};

export type WorkerEngineApi = typeof api;

Comlink.expose(api);
