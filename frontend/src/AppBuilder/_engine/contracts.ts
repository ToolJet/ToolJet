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
 *  Mirrors the CSA set registered in useInput.js:160-235 today, including the
 *  deprecated aliases (disable/visibility/loading) legacy apps still call. */
const inputStateActions: ComponentTypeContract['stateActions'] = {
  setValue: (_cur, [value]) => ({ value }),
  setText: (_cur, [text]) => ({ value: text }),
  clear: () => ({ value: '' }),
  setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
  // deprecated aliases (useInput.js:215-224)
  visibility: (_cur, [visible]) => ({ isVisible: !!visible }),
  disable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
  loading: (_cur, [loading]) => ({ isLoading: !!loading }),
};

export const TextInputContract: ComponentTypeContract = {
  type: 'TextInput',
  stateActions: inputStateActions,
  effectActions: ['setFocus', 'setBlur'],
};

registerContract(TextInputContract);
// Password/Email/TextArea share TextInput's CSA semantics verbatim.
registerContract({ ...TextInputContract, type: 'PasswordInput' });
registerContract({ ...TextInputContract, type: 'EmailInput' });
registerContract({ ...TextInputContract, type: 'TextArea' });

/** NumberInput owns the NaN→null normalization (today a post-hoc widget
 *  effect, NumberInput.jsx:86-90). */
registerContract({
  type: 'NumberInput',
  stateActions: {
    ...inputStateActions,
    setValue: (_cur, [value]) => {
      const parsed = value === null || value === undefined || value === '' ? null : Number(value);
      return { value: parsed === null || Number.isNaN(parsed) ? null : parsed };
    },
    clear: () => ({ value: null }),
  },
  effectActions: ['setFocus', 'setBlur'],
});

// TODO(Phase 3a steps 5-6): CurrencyInputContract and PhoneInputContract —
// decimal formatting / E.164 country rebasing move here from the widgets'
// stale closures when those widgets migrate (design doc §1a).
