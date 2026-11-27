import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { isExpressionValue, toExpression, variableKey } from '../variableDefinitions';
import { addEntry, detailOf, prettyExpression } from './internals';
import type { UsageEntry } from './types';

/** Static initial values read nothing; expressions use the same AST parser as runtime registration. */
export function getVariableDefinitionRefs(state: any, moduleId: string) {
  const { componentNameIdMapping = {}, queryNameIdMapping = {} } = state.modules?.[moduleId] ?? {};
  return (state.getVariableDefinitions?.(moduleId) ?? []).filter(isExpressionValue).map((definition: any) => {
    const expression = toExpression(definition);
    const { allRefs } = extractAndReplaceReferencesFromString(expression, componentNameIdMapping, queryNameIdMapping);
    return { definition, expression: prettyExpression(state, moduleId, expression) ?? expression, refs: allRefs };
  });
}

/** Reverse links are derived from definitions, even before a query has returned a value. */
export function addVariableDefinitionReaders(
  usedBy: Map<string, UsageEntry>,
  entityType: 'queries' | 'components',
  entityId: string,
  definitions: ReturnType<typeof getVariableDefinitionRefs>
) {
  definitions.forEach(({ definition, expression, refs }: any) => {
    if (!refs.some((ref: any) => ref.entityType === entityType && ref.entityNameOrId === entityId)) return;
    addEntry(
      usedBy,
      definition.scope === 'page' ? 'pageVariable' : 'variable',
      variableKey(definition.scope, definition.name),
      definition.name,
      detailOf('Initial value', expression)
    );
  });
}
