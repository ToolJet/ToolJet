import { Constants } from '@/_helpers/utils';
import type { ConstantType } from '@/_services/types/organizationConstantsV2.types';

export type { ConstantType };

// `Constants` is the shared source for the two type names; this only gives it literal types.
export const ConstantTypes = Constants as { readonly [Type in ConstantType]: Type };
