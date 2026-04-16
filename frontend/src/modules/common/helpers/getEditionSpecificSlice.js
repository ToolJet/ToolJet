// DEPRECATED: Each store slice now imports its EE counterpart directly so webpack
// can tree-shake per slice instead of bundling all of @ee/modules/_slices at once.
// This file is kept only in case external callers still reference it.
// Remove once confirmed unused.
import { fetchEdition } from './utils';
import config from 'config';

export function getEditionSpecificSlice(_slice) {
  const edition = fetchEdition(config);
  if (edition === 'ce') return () => ({});
  console.warn(`getEditionSpecificSlice('${_slice}') is deprecated. Import the EE slice directly.`);
  return () => ({});
}
