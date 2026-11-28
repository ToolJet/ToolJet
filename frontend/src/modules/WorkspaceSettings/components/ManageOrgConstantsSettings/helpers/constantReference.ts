import { copyToClipboard } from '@/_helpers/appUtils';
import type { ConstantListItem } from '@/_services/types/organizationConstantsV2.types';
import { ConstantTypes } from './constantType';

export const getConstantReference = ({ type, name }: Pick<ConstantListItem, 'type' | 'name'>): string =>
  type === ConstantTypes.Secret ? `{{secrets.${name}}}` : `{{constants.${name}}}`;

export const copyConstantReference = (constant: Pick<ConstantListItem, 'type' | 'name'>) =>
  copyToClipboard(getConstantReference(constant));
