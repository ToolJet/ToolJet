/**
 * Standard contract group (Phase 3b wave 2).
 *
 * Component types whose only Bucket B CSAs are the shared
 * visibility/disable/loading trio (registered today by the shared
 * `useExposeState` hook as per-instance closures) get their contract from this
 * factory instead. The hook (`_hooks/useExposeVariables.ts`) generates its CSA
 * dispatchers from these contracts via useComponentCommands.csaShims().
 *
 * NOTE: the old hook registered exactly setDisable/setVisibility/setLoading —
 * no deprecated aliases (disable/visibility/loading) — so none are added here.
 */
import { registerContract, getContract } from '@/AppBuilder/_engine/contracts';
import type { ComponentTypeContract } from '@/AppBuilder/_engine/types';

export function makeStandardContract(
  type: string,
  extra?: Partial<Pick<ComponentTypeContract, 'stateActions' | 'effectActions'>>
): ComponentTypeContract {
  return {
    type,
    stateActions: {
      setVisibility: (_cur, [visible]) => ({ isVisible: !!visible }),
      setDisable: (_cur, [disabled]) => ({ isDisabled: !!disabled }),
      setLoading: (_cur, [loading]) => ({ isLoading: !!loading }),
      ...extra?.stateActions,
    },
    ...(extra?.effectActions ? { effectActions: extra.effectActions } : {}),
    // The shared useExposeState hook's mount snapshot is exactly this trio,
    // sourced from `properties.visibility/disabledState/loadingState` for
    // every STANDARD_CONTRACT_TYPES widget (verified against each type's
    // useExposeState(...) call site — all pass properties.* directly).
    deriveExposed: (properties) => ({
      isVisible: properties?.visibility,
      isDisabled: properties?.disabledState,
      isLoading: properties?.loadingState,
    }),
  };
}

/** Register the standard contract iff the type doesn't already own a richer
 *  one (types converted individually later must win over this baseline). */
export function ensureStandardContract(type?: string): void {
  if (!type || getContract(type)) return;
  registerContract(makeStandardContract(type));
}

/** Component types whose widgets consume the shared useExposeState hook —
 *  verified against the AllComponents keys in _helpers/editorHelpers.js
 *  (StarRating renders Widgets/Rating; FileInput/FileButton reuse
 *  FilePicker's useFilePicker hook). */
const STANDARD_CONTRACT_TYPES = [
  'Tabs',
  'Form',
  'StarRating',
  'KeyValuePair',
  'Container',
  'FlexContainer',
  'FilePicker',
  'FileInput',
  'FileButton',
];

for (const type of STANDARD_CONTRACT_TYPES) ensureStandardContract(type);
