import { createModuleSlice as eeCreateModuleSlice } from '@ee/modules/Modules/slices/moduleSlice';

const createModuleSlice = eeCreateModuleSlice ?? (() => ({}));

export { createModuleSlice };
