import { extractQueryReferences } from '@/AppBuilder/_utils/queryPanel';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { prettyExpression } from './internals';

const queryRefsCache = new WeakMap<object, any[]>();

export function getQueryRefs(state: any, query: any, moduleId = 'canvas'): any[] {
  const options = query?.options;
  if (!options || typeof options !== 'object') return [];
  const cached = queryRefsCache.get(options);
  if (cached) return cached;

  const refs: any[] = [];
  try {
    const strings = extractQueryReferences(query.kind, options);
    const componentNameIdMapping = state.modules?.[moduleId]?.componentNameIdMapping ?? {};
    const queryNameIdMapping = state.modules?.[moduleId]?.queryNameIdMapping ?? {};
    strings.forEach((str: string) => {
      try {
        const { allRefs } = extractAndReplaceReferencesFromString(str, componentNameIdMapping, queryNameIdMapping);
        allRefs.forEach((ref: any) => refs.push({ ...ref, sourceString: prettyExpression(state, moduleId, str) }));
      } catch (e) {
        // unparsable expression — skip
      }
    });
  } catch (e) {
    // plugin schema lookup failed — treat as no refs
  }
  queryRefsCache.set(options, refs);
  return refs;
}
