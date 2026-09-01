import { deepFreeze } from './shared';

export const APP_BUILDER_SEAMS = ['pure-jest', 'store', 'rtl', 'contract', 'cypress'];
export const APP_BUILDER_SURFACES = [
  'app-editor',
  'module-editor',
  'authenticated-preview',
  'released-viewer',
  'embedded-viewer',
  'consumed-module',
];

const required = [
  'id',
  'name',
  'primarySeam',
  'surface',
  'edition',
  'environment',
  'layout',
  'version',
  'transferPath',
  'access',
  'capabilities',
];

export function defineAppBuilderScenario(input) {
  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      throw new Error(`App Builder scenario requires ${field}`);
    }
  }
  if (!APP_BUILDER_SEAMS.includes(input.primarySeam)) throw new Error(`Unknown primarySeam: ${input.primarySeam}`);
  if (!APP_BUILDER_SURFACES.includes(input.surface)) throw new Error(`Unknown surface: ${input.surface}`);
  if (!['ce', 'ee'].includes(input.edition)) throw new Error(`Unknown edition: ${input.edition}`);
  const allowedCapabilities = ['network', 'time', 'ids', 'geometry', 'observers', 'media', 'storage'];
  for (const capability of Object.keys(input.capabilities)) {
    if (!allowedCapabilities.includes(capability)) throw new Error(`Unknown capability: ${capability}`);
  }
  JSON.stringify(input);
  return deepFreeze({ ...input });
}
