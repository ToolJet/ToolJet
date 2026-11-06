import { copyToClipboard } from '@/_helpers/appUtils';

export const getConstantReference = ({ type, name }) =>
  type === 'Secret' ? `{{secrets.${name}}}` : `{{constants.${name}}}`;

export const copyConstantReference = (constant) => copyToClipboard(getConstantReference(constant));
