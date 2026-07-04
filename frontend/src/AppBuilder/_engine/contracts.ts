/**
 * Per-component-type contracts (Phase 3).
 *
 * Each Bucket B CSA is defined ONCE per component type as a pure reducer over
 * that component's runtime state — replacing today's per-instance closures
 * registered by mounted widgets (the mount-coupling this program removes).
 * Bucket C names route to EffectIntents executed by the mounted widget.
 *
 * Coverage grows with the Phase 3 widget conversions; TextInput (the useInput
 * family's contract) is the reference implementation.
 */
import type { ComponentTypeContract } from './types';

const registry = new Map<string, ComponentTypeContract>();

export function registerContract(contract: ComponentTypeContract): void {
  registry.set(contract.type, contract);
}

export function getContract(type: string): ComponentTypeContract | undefined {
  return registry.get(type);
}

/** Reference contract for the useInput family (TextInput et al.).
 *  Mirrors the CSA set registered in useInput.js:160-235 today. */
export const TextInputContract: ComponentTypeContract = {
  type: 'TextInput',
  stateActions: {
    setValue: (_cur, [value]) => ({ value }),
    setText: (_cur, [text]) => ({ value: text }),
    clear: () => ({ value: '' }),
    setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
    setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
    setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
  },
  effectActions: ['setFocus', 'setBlur'],
};

registerContract(TextInputContract);
