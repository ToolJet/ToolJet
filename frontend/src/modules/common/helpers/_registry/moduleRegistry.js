// src/utils/moduleRegistry.js
import * as eeModules from '@ee/modules';
import * as cloudModules from '@cloud/modules';
import * as ceModules from '@/modules';

export const editions = {
  ee: eeModules,
  cloud: cloudModules,
  ce: ceModules,
};
