/**
 * Component command dispatcher (Phase 3a) — THE seam between widgets and
 * whatever owns state.
 *
 * Controlled widgets never mutate local state for exposed values. User input
 * and CSA invocations become EngineCommands dispatched here. Today the
 * `storeBackend` applies them to the Zustand store (write-through via the
 * row-aware setExposedVariables the widget received from RenderWidget, which
 * also fires the dependency cascade). When the engine becomes the store of
 * record, the backend binding below swaps to one that calls
 * `engine.applyCommands` — widgets, contracts, CSA shims and the effect
 * registry are identical in both worlds.
 *
 * Bucket C effects (setFocus/setBlur/…) execute through the effect-handler
 * registry: mounted widgets register ref-based handlers; unmounted → no-op.
 * This is the same execution path future engine EffectIntents will use.
 */
import { getContract } from './contracts';
import type { EngineCommand } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DispatchCtx {
  componentId: string;
  componentType: string;
  moduleId?: string;
  /** Row-aware write-through provided by RenderWidget (flat or per-row). */
  setExposedVariables: (variables: Record<string, unknown>) => void;
  /** Current exposed values of this component (row-scoped where relevant) —
   *  reducers read current state from here (e.g. phone country). */
  getCurrentExposed?: () => Record<string, unknown>;
  /** Row-aware validator from RenderWidget; folds isValid into value patches.
   *  Receives the full patch so wrappers can read sibling keys (phone strips
   *  the calling code of the patch's target country before validating). */
  validate?: (value: unknown, patch?: Record<string, unknown>) => { isValid?: boolean } | undefined;
  fireEvent?: (eventName: string, ...args: unknown[]) => void;
  /** Effect-registry key for row instances (`componentId` or `componentId:row`). */
  rowKey?: string;
  /** Called with each applied patch — lets the widget update its local echo. */
  onPatch?: (patch: Record<string, unknown>) => void;
}

export type CommandBackend = (commands: EngineCommand[], ctx: DispatchCtx) => void;

/* ── Effect-handler registry (Bucket C execution) ─────────────────────────── */

const effectHandlers = new Map<string, Record<string, (...args: unknown[]) => void>>();

const effectKey = (componentId: string, rowKey?: string) => rowKey ?? componentId;

/** Mounted widget registers its ref-based effect handlers; returns cleanup. */
export function registerEffectHandlers(
  componentId: string,
  rowKey: string | undefined,
  handlers: Record<string, (...args: unknown[]) => void>
): () => void {
  const key = effectKey(componentId, rowKey);
  effectHandlers.set(key, { ...effectHandlers.get(key), ...handlers });
  return () => {
    const current = effectHandlers.get(key);
    if (!current) return;
    for (const name of Object.keys(handlers)) delete current[name];
    if (!Object.keys(current).length) effectHandlers.delete(key);
  };
}

/** Execute a Bucket C effect on the mounted widget. No-op when unmounted —
 *  semantically correct (you cannot focus an off-screen input). */
export function executeEffect(componentId: string, rowKey: string | undefined, effect: string, args: unknown[] = []): boolean {
  const handler = effectHandlers.get(effectKey(componentId, rowKey))?.[effect];
  if (!handler) return false;
  handler(...args);
  return true;
}

/* ── Store backend (Phase 3: main-thread, Zustand is the store of record) ── */

const storeBackend: CommandBackend = (commands, ctx) => {
  for (const command of commands) {
    if (command.kind === 'INVOKE_CSA') {
      const contract = getContract(ctx.componentType);
      if (contract?.effectActions?.includes(command.action)) {
        executeEffect(ctx.componentId, ctx.rowKey, command.action, command.args);
        continue;
      }
      const reducer = contract?.stateActions?.[command.action];
      if (!reducer) continue; // unknown action — legacy paths handle or ignore
      const current = ctx.getCurrentExposed?.() ?? {};
      const patch = reducer(current, command.args);
      // Validation stays widget-side in Phase 3; fold isValid into the same
      // write batch so one dispatch = one cascade (matches today's cost).
      if ('value' in patch && ctx.validate) {
        const status = ctx.validate(patch.value, patch);
        if (status && 'isValid' in status) patch.isValid = status.isValid;
      }
      ctx.setExposedVariables(patch);
      ctx.onPatch?.(patch);
    } else if (command.kind === 'FIRE_EVENT') {
      ctx.fireEvent?.(command.event);
    }
    // SET_RUNTIME / SET_VISIBLE_ROWS are not widget-originated commands.
  }
};

/** The one-line engine swap: replace with an engineBackend that feeds
 *  engine.applyCommands and applies its updates/effects (see Phase 3a design
 *  doc §5). Can be flag-gated through __tjEngineCutover once wired. */
let backend: CommandBackend = storeBackend;

export function setCommandBackend(next: CommandBackend): void {
  backend = next;
}

export function dispatchComponentCommands(commands: EngineCommand[], ctx: DispatchCtx): void {
  backend(commands, ctx);
}
