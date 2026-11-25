import { BadRequestException } from '@nestjs/common';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** Why an entry is not a well-formed `{ id, name, value, fxActive }` definition, or null when it is. */
function definitionProblem(entry: unknown): string | null {
  if (!isPlainObject(entry)) return 'must be an object';
  if (typeof entry.id !== 'string' || !entry.id) return 'needs a non-empty string id';
  if (typeof entry.name !== 'string') return 'needs a string name';
  if (typeof entry.value !== 'string') return 'needs a string value';
  if (typeof entry.fxActive !== 'boolean') return 'needs a boolean fxActive';
  return null;
}

/**
 * Rejects a declared-variables map (app `globalSettings.variables` or a page's `variables`) that the
 * editor could not load: one malformed entry stops the whole editor from initializing. These routes
 * save the map as sent, and the app-validation rules only report for editor writes, so this check
 * is enforced for every caller. A missing or null map is allowed: pages without variables store null.
 */
export function assertVariableDefinitionMap(map: unknown, path: string): void {
  if (map === null || map === undefined) return;
  if (!isPlainObject(map)) {
    throw new BadRequestException(`${path} must be an object of variable definitions keyed by id`);
  }
  for (const [key, entry] of Object.entries(map)) {
    const problem = definitionProblem(entry);
    if (problem) throw new BadRequestException(`${path}.${key} ${problem}`);
  }
}
