// Direct import so webpack only pulls in AiBuilder/slices, not the entire EE tree.
// For CE builds, @ee is replaced with emptyModule by NormalModuleReplacementPlugin,
// so eeCreateAiSlice is undefined and the no-op fallback is used instead.
import { createAiSlice as eeCreateAiSlice } from '@ee/modules/AiBuilder/slices/aiSlice';

const createAiSlice = eeCreateAiSlice ?? (() => ({}));

export { createAiSlice };
