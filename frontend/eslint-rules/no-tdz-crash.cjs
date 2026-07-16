'use strict';

/**
 * no-tdz-crash — flags uses of `let`/`const`/`class` bindings that are GUARANTEED
 * (or near-guaranteed) to throw "Cannot access 'X' before initialization" at runtime.
 *
 * Background: until 2026-07 the frontend was transpiled to ES5, which rewrites
 * `let`/`const` to `var` and silently erases the temporal dead zone — so these bugs
 * evaluated to `undefined` instead of crashing. Modern build output (SWC/Rspack,
 * es2022 targets) enforces real TDZ semantics and the crashes surfaced one by one
 * (GitSyncModal, AppCanvas, EnvironmentSelectBox, ...). This rule catches the whole
 * class statically.
 *
 * Unlike core `no-use-before-define`, this rule:
 * - IGNORES references inside deferred closures (event handlers, useEffect/useCallback
 *   bodies) — those run after initialization and are safe, which is why the core rule
 *   produces ~500 false positives on this codebase.
 * - FOLLOWS references through closures that are invoked synchronously at their
 *   definition site: IIFEs, `useMemo`/`useState` initializer callbacks, sync array
 *   methods (.map/.filter/...), and selector-style hooks (`useStore`, `useSelector`,
 *   `useShallow`) whose callback runs during render.
 * - CATCHES self-references in a variable's own initializer
 *   (`const x = x ?? fallback`), which are textually "after" the declaration but
 *   still in the dead zone.
 */

const SYNC_ARRAY_METHODS = new Set([
  'map',
  'forEach',
  'filter',
  'reduce',
  'reduceRight',
  'some',
  'every',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flatMap',
  'sort',
]);

// Hooks whose FIRST argument is a callback invoked synchronously during render.
const SYNC_CALLBACK_HOOKS = /^(React\.)?(useMemo|useState|useStore|useSelector|useShallow)$/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow uses of let/const/class bindings that throw a TDZ ReferenceError at runtime',
    },
    schema: [],
    messages: {
      tdz: "'{{name}}' is evaluated before its declaration (line {{line}}) finishes initializing — this throws a ReferenceError at runtime.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    const nearestFn = (scope) => {
      let s = scope;
      while (s && s.type !== 'function' && s.type !== 'module' && s.type !== 'global') s = s.upper;
      return s;
    };

    // A closure invoked synchronously at its definition site.
    const isSyncWrapper = (node) => {
      const p = node.parent;
      if (!p || p.type !== 'CallExpression') return false;
      if (p.callee === node) return true; // IIFE
      if (p.arguments.indexOf(node) !== 0) return false;
      const calleeText = sourceCode.getText(p.callee);
      if (SYNC_CALLBACK_HOOKS.test(calleeText)) return true;
      if (p.callee.type === 'MemberExpression' && !p.callee.computed && SYNC_ARRAY_METHODS.has(p.callee.property.name))
        return true;
      return false;
    };

    const check = (scope) => {
      for (const ref of scope.references) {
        const v = ref.resolved;
        if (!v || v.defs.length === 0) continue;
        const def = v.defs[0];
        const isTdzKind =
          (def.type === 'Variable' && def.parent && (def.parent.kind === 'let' || def.parent.kind === 'const')) ||
          def.type === 'ClassName';
        if (!isTdzKind) continue;

        const refStart = ref.identifier.range[0];
        const usedBeforeDecl = refStart < def.name.range[0];
        // Self-reference inside the declarator's own initializer: `const x = x ?? y`
        const inOwnInitializer =
          !usedBeforeDecl &&
          def.node.type === 'VariableDeclarator' &&
          def.node.init &&
          ref.identifier !== def.name &&
          refStart >= def.node.init.range[0] &&
          refStart <= def.node.init.range[1];
        if (!usedBeforeDecl && !inOwnInitializer) continue;

        // Walk from the reference's scope toward the declaration's function scope.
        // Crossing a deferred closure => safe; crossing only sync-invoked closures
        // (or nothing) => guaranteed crash.
        const target = nearestFn(v.scope);
        let s = ref.from;
        let dangerous = false;
        while (s) {
          if (s === target) {
            dangerous = true;
            break;
          }
          if (s.type === 'function' && !isSyncWrapper(s.block)) break;
          s = s.upper;
        }
        if (dangerous) {
          context.report({
            node: ref.identifier,
            messageId: 'tdz',
            data: { name: v.name, line: String(def.name.loc.start.line) },
          });
        }
      }
      scope.childScopes.forEach(check);
    };

    return {
      'Program:exit': () => check(sourceCode.getScope(sourceCode.ast)),
    };
  },
};
