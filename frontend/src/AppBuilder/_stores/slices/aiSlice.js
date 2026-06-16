import * as eeSlices from '@ee/modules/_slices';

// Namespace import (not named) so the CE build — where @ee/* resolves to the
// empty module — doesn't emit "export not found" warnings. The ternary folds
// at build time via DefinePlugin.
const createAiSlice = process.env.TOOLJET_EDITION === 'ce' ? () => ({}) : eeSlices.createAiSlice;

export { createAiSlice };
