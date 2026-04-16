import { createFixWithAiSlice as eeCreateFixWithAiSlice } from '@ee/modules/AiBuilder/slices/fixWithAi';

const createFixWithAiSlice = eeCreateFixWithAiSlice ?? (() => ({}));

export { createFixWithAiSlice };
