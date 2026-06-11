import { SetMetadata } from '@nestjs/common';
import { MODULES } from '../constants/modules';

export const InitModule = (moduleId: MODULES) => SetMetadata('tjModuleId', moduleId);
