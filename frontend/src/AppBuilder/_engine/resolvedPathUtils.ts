/**
 * Shared parsing for engine/store binding paths
 * ("components.<id>.<type>.<key...>"). Extracted so shadowCompare.ts (diff)
 * and workerWriteBehind.ts (apply) don't each hand-roll the same split.
 */
import { hasArrayNotation } from '@/AppBuilder/_stores/utils';

export interface ParsedResolvedPath {
  entityType: string;
  entityId: string;
  type: string | undefined;
  key: string;
  isArrayNotation: boolean;
}

export function parseResolvedPath(bindingPath: string): ParsedResolvedPath {
  const [entityType, entityId, type, ...keys] = bindingPath.split('.');
  const key = keys.join('.');
  return { entityType, entityId, type, key, isArrayNotation: hasArrayNotation(key) };
}
