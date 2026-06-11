import { fetchEdition } from './utils';
import config from 'config';
import * as eeSlices from '@ee/modules/_slices';

// import { editions } from './_registry/moduleRegistry';

const sliceRegistry = {
  ee: eeSlices,
  cloud: eeSlices,
  ce: {},
};

export function getEditionSpecificSlice(slice) {
  const edition = fetchEdition(config);
  if (edition === 'ce') {
    return () => ({});
  }
  const EditionSlice = sliceRegistry[edition]?.[slice];
  if (!EditionSlice) {
    console.warn(`Slice ${slice} not found for ${edition} edition`);
    return () => ({});
  }
  return EditionSlice;
}
