import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

/** A saved declared variable. The map key is its name; there is no separate definition id. */
export interface VariableDefinition {
  value: string;
  fxActive: boolean;
}

/** App `globalSettings.variables` or a page's `variables`: `{ [name]: { value, fxActive } }`. */
export type VariableDefinitionMap = Record<string, VariableDefinition>;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
// Names that can't be declared. Keep in step with the other copy (frontend _utils/variableDefinitions.js
// and server helpers/variable-definition-map.helper.ts).
const BLOCKED_NAMES = new Set([
  'prototype',
  // Inherited by every plain object, so `variables.<name>` already resolves to one of these:
  // `__proto__` changes the prototype when assigned, and the rest are Object.prototype methods
  // (`variables.toString` is a function until a variable with that name is set).
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);
const DEFINITION_FIELDS = new Set(['value', 'fxActive']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const nameProblem = (name: string): string | null => {
  if (!IDENTIFIER.test(name)) return 'is not a valid variable name';
  if (BLOCKED_NAMES.has(name)) return 'is a reserved name';
  return null;
};

/** Why an entry is not a well-formed `{ value, fxActive }` definition, or null when it is. */
function definitionProblem(entry: unknown): string | null {
  if (!isPlainObject(entry)) return 'must be an object';
  const extra = Object.keys(entry).find((key) => !DEFINITION_FIELDS.has(key));
  if (extra) return `has an unexpected field ${extra}; definitions are keyed by name`;
  if (typeof entry.value !== 'string') return 'needs a string value';
  if (typeof entry.fxActive !== 'boolean') return 'needs a boolean fxActive';
  return null;
}

/**
 * For a request DTO field that holds a variables map (or settings containing one): keeps the value
 * exactly as sent. The global ValidationPipe converts bodies with class-transformer, which silently
 * skips keys that are inherited functions on a plain object (`toString`, `valueOf`, ...) and
 * `__proto__`. That would drop a reserved name before `assertVariableDefinitionMap` could reject it,
 * and save a map holding only reserved names as `{}`, clearing the existing variables.
 */
export const KeepVariableMapAsSent = (): PropertyDecorator =>
  Transform(({ obj, key }) => (obj as Record<string, unknown>)[key], { toClassOnly: true });

/**
 * Rejects a declared-variables map the editor could not load, so one malformed entry can't stop
 * the whole editor from initializing. These routes save the map as sent, and the app-validation
 * rules only report for editor writes, so this check is enforced for every caller. A missing or
 * null map is allowed: pages without variables store null.
 */
export function assertVariableDefinitionMap(map: unknown, path: string): void {
  if (map === null || map === undefined) return;
  if (!isPlainObject(map)) {
    throw new BadRequestException(`${path} must be an object of variable definitions keyed by name`);
  }
  for (const [name, entry] of Object.entries(map)) {
    const problem = nameProblem(name) ?? definitionProblem(entry);
    if (problem) throw new BadRequestException(`${path}.${name} ${problem}`);
  }
}

/**
 * A map read from an import or a Git pull, in the saved shape. Development builds saved
 * `{ [id]: { id, name, value, fxActive } }` before maps were keyed by name; those entries are
 * re-keyed by their name. Two entries with the same name are refused instead of one being dropped,
 * and anything else malformed is rejected as it would be on save. null and undefined pass through.
 */
export function readVariableDefinitionMap<T extends null | undefined>(map: T, path: string): T;
export function readVariableDefinitionMap(map: unknown, path: string): VariableDefinitionMap | null | undefined;
export function readVariableDefinitionMap(map: unknown, path: string): VariableDefinitionMap | null | undefined {
  if (map === null || map === undefined) return map as null | undefined;
  if (!isPlainObject(map)) {
    throw new BadRequestException(`${path} must be an object of variable definitions keyed by name`);
  }
  const result: VariableDefinitionMap = {};
  for (const [key, entry] of Object.entries(map)) {
    const isIdKeyed = isPlainObject(entry) && typeof entry.id === 'string' && typeof entry.name === 'string';
    const name = isIdKeyed ? (entry.name as string) : key;
    const definition = isIdKeyed ? { value: entry.value, fxActive: entry.fxActive ?? entry.fx_active ?? false } : entry;
    if (Object.prototype.hasOwnProperty.call(result, name)) {
      throw new BadRequestException(`${path} has more than one variable named ${name}`);
    }
    const problem = nameProblem(name) ?? definitionProblem(definition);
    if (problem) throw new BadRequestException(`${path}.${name} ${problem}`);
    result[name] = definition as VariableDefinition;
  }
  return result;
}
