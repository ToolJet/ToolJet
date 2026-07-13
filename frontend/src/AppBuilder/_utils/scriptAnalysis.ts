import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/**
 * Static analysis of RunJS / transformation code for the Dependency Viewer.
 *
 * RunJS bodies reference entities via plain JS (components.table1.x,
 * queries.q1.run(), actions.setVariable('k', v)) with no {{}} wrapper, so the
 * reactive engine and the {{}} AST extractor never see them. This module
 * extracts those refs by name. Parse failures double as the syntax check.
 *
 * Names are page-scoped display names; callers resolve them to ids via
 * componentNameIdMapping / queryNameIdMapping.
 */

export type ScriptAnalysis = {
  componentRefs: string[];
  queryRefs: string[];
  variableWrites: string[];
  variableReads: string[];
  pageVariableWrites: string[];
  pageVariableReads: string[];
  dynamicVariableOps: boolean; // a variable op whose key is not a string literal
  syntaxError: { message: string; line: number; column: number } | null;
};

type BucketKey = 'variableWrites' | 'variableReads' | 'pageVariableWrites' | 'pageVariableReads';

// actions.<fn>('literalKey', …) → which bucket the key lands in.
// Map (not object) so prototype names like hasOwnProperty can't alias a bucket.
const ACTION_FN_BUCKETS = new Map<string, BucketKey>([
  ['setVariable', 'variableWrites'],
  ['unSetVariable', 'variableWrites'],
  ['getVariable', 'variableReads'],
  ['setPageVariable', 'pageVariableWrites'],
  ['unsetPageVariable', 'pageVariableWrites'],
  ['getPageVariable', 'pageVariableReads'],
]);

// actions.<fn>('queryName', …) → query ref
const ACTION_QUERY_FNS = new Set(['runQuery', 'resetQuery', 'abortQuery']);

const propName = (node: any): string | null => {
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name;
  if (node.computed && node.property?.type === 'Literal' && typeof node.property.value === 'string')
    return node.property.value;
  return null;
};

export function analyzeScript(code: string): ScriptAnalysis {
  const result: ScriptAnalysis = {
    componentRefs: [],
    queryRefs: [],
    variableWrites: [],
    variableReads: [],
    pageVariableWrites: [],
    pageVariableReads: [],
    dynamicVariableOps: false,
    syntaxError: null,
  };

  let ast;
  try {
    // RunJS bodies run inside an AsyncFunction: top-level await and return are legal.
    ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
    });
  } catch (e: any) {
    result.syntaxError = {
      message: String(e?.message ?? e).replace(/\s*\(\d+:\d+\)\s*$/, ''),
      line: e?.loc?.line ?? 1,
      column: e?.loc?.column ?? 0,
    };
    return result;
  }

  const buckets: Record<string, Set<string>> = {
    componentRefs: new Set(),
    queryRefs: new Set(),
    variableWrites: new Set(),
    variableReads: new Set(),
    pageVariableWrites: new Set(),
    pageVariableReads: new Set(),
  };

  try {
    walk.simple(ast, {
      MemberExpression(node: any) {
        // components.<name> / queries.<name> / variables.<name>
        if (node.object?.type === 'Identifier') {
          const root = node.object.name;
          const name = propName(node);
          if (!name) return;
          if (root === 'components') buckets.componentRefs.add(name);
          else if (root === 'queries') buckets.queryRefs.add(name);
          else if (root === 'variables') buckets.variableReads.add(name);
          return;
        }
        // page.variables.<name>
        if (
          node.object?.type === 'MemberExpression' &&
          node.object.object?.type === 'Identifier' &&
          node.object.object.name === 'page' &&
          propName(node.object) === 'variables'
        ) {
          const name = propName(node);
          if (name) buckets.pageVariableReads.add(name);
        }
      },
      CallExpression(node: any) {
        const callee = node.callee;
        if (callee?.type !== 'MemberExpression') return;
        if (callee.object?.type !== 'Identifier' || callee.object.name !== 'actions') return;
        const fn = propName(callee);
        if (!fn) return;

        const firstArg = node.arguments?.[0];
        const literalKey =
          firstArg?.type === 'Literal' && typeof firstArg.value === 'string' ? firstArg.value : null;

        if (ACTION_QUERY_FNS.has(fn)) {
          if (literalKey) buckets.queryRefs.add(literalKey);
          return;
        }
        const bucket = ACTION_FN_BUCKETS.get(fn);
        if (bucket) {
          if (literalKey) buckets[bucket].add(literalKey);
          else result.dynamicVariableOps = true;
        }
      },
    });
  } catch (e) {
    // walker failure — keep whatever was collected so far
  }

  result.componentRefs = Array.from(buckets.componentRefs).sort();
  result.queryRefs = Array.from(buckets.queryRefs).sort();
  result.variableWrites = Array.from(buckets.variableWrites).sort();
  result.variableReads = Array.from(buckets.variableReads).sort();
  result.pageVariableWrites = Array.from(buckets.pageVariableWrites).sort();
  result.pageVariableReads = Array.from(buckets.pageVariableReads).sort();
  return result;
}

type QueryCodeAnalyses = { script: ScriptAnalysis | null; transformation: ScriptAnalysis | null };

// Memoized per options object — query saves replace options, invalidating the entry.
const analysesCache = new WeakMap<object, QueryCodeAnalyses>();

/**
 * Analyses for a query's custom code:
 * - script: the RunJS body (options.code). RunPy is never parsed → null.
 * - transformation: the active transformation code when enabled and JS.
 */
export function getQueryCodeAnalyses(query: any): QueryCodeAnalyses {
  const options = query?.options;
  if (!options || typeof options !== 'object') return { script: null, transformation: null };
  const cached = analysesCache.get(options);
  if (cached) return cached;

  let script: ScriptAnalysis | null = null;
  if (query.kind === 'runjs' && typeof options.code === 'string' && options.code.trim()) {
    script = analyzeScript(options.code);
  }

  let transformation: ScriptAnalysis | null = null;
  if (options.enableTransformation) {
    const lang = options.transformationLanguage ?? 'javascript';
    const code = options.transformations?.[lang] ?? options.transformation;
    if (lang === 'javascript' && typeof code === 'string' && code.trim()) {
      transformation = analyzeScript(code);
    }
  }

  const analyses = { script, transformation };
  analysesCache.set(options, analyses);
  return analyses;
}
