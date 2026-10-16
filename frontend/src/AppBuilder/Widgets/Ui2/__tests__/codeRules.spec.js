// Guardrail: the UI 2.0 widgets stay on ToolJet's Tailwind build and keep their hooks honest.
// - Classes in class positions (className, cn, cva, clsx) are ToolJet's prefixed utilities (`tw-`): an unprefixed
//   Tailwind class would silently do nothing, or pick up a Bootstrap class of the same name.
// - No `!important` in the pack's styles, except the one documented rule in shadcn.scss (a global !important to undo).
// - No `react-hooks/exhaustive-deps` suppressions: dependencies are complete (useStable and useLatest in packHooks are
//   the tools for bound data and latest-value reads).
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';

const UI2 = path.resolve(__dirname, '..');
const walk = (dir, test) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(p, test);
    return test(e.name) ? [p] : [];
  });
const sources = walk(UI2, (name) => /\.tsx?$/.test(name) && !name.endsWith('.d.ts'));
const stylesheets = walk(UI2, (name) => name.endsWith('.scss'));
const rel = (p) => path.relative(UI2, p);

/** Every string in a class position of a module: className values and the arguments of the class helpers, except
 *  object keys and the arguments of other calls nested in them (`buttonVariants({ variant: 'outline' })`). */
const classStrings = (code) => {
  const out = [];
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const visit = (node, inClass) => {
    if (!node || typeof node.type !== 'string') return;
    if (inClass && node.type === 'StringLiteral') out.push(node.value);
    if (inClass && node.type === 'TemplateElement') out.push(node.value.cooked ?? '');
    let classHere = inClass;
    if (node.type === 'JSXAttribute') classHere = /^(className|class|\w*ClassNames?)$/.test(node.name?.name ?? '');
    if (node.type === 'CallExpression') {
      const name = node.callee.type === 'Identifier' ? node.callee.name : '';
      classHere = ['cn', 'cva', 'clsx', 'cx'].includes(name);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      if (node.type === 'ObjectProperty' && key === 'key') continue;
      if (node.type === 'BinaryExpression') continue; // comparisons hold data
      if (node.type === 'MemberExpression' && key === 'property') continue; // a lookup key is data
      if (Array.isArray(child)) child.forEach((c) => visit(c, classHere));
      else if (child && typeof child === 'object') visit(child, classHere);
    }
  };
  visit(ast.program, false);
  return out;
};

describe('UI 2.0 widget code rules', () => {
  it('uses only prefixed Tailwind classes in class positions', () => {
    const resolveConfig = require('tailwindcss/resolveConfig');
    const { createContext } = require('tailwindcss/lib/lib/setupContextUtils');
    const plain = createContext(resolveConfig({ content: [{ raw: '' }] }));
    const utility = (cls) => plain.getClassOrder([cls])[0][1] !== null;
    const offenders = [];
    for (const file of sources) {
      for (const text of classStrings(fs.readFileSync(file, 'utf8'))) {
        for (const token of text.split(/\s+/).filter(Boolean)) {
          // prefixed, or an arbitrary property (`[--x:1]`), which Tailwind writes without the prefix
          if (/(^|:)!?-?(tw-|\[)/.test(token)) continue;
          if (utility(token)) offenders.push(`${rel(file)}: ${token}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no !important beyond the documented reset rule', () => {
    const found = stylesheets.flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => [line, i + 1])
        .filter(([line]) => /!important/.test(line) && !/^\s*\/\//.test(line))
        .map(([line, n]) => `${rel(file)}:${n}: ${line.trim()}`)
    );
    expect(found).toEqual([expect.stringMatching(/shadcn\.scss:\d+: outline-color: transparent !important;/)]);
  });

  it('suppresses no react-hooks/exhaustive-deps warnings', () => {
    const found = sources.filter((file) =>
      /eslint-disable[^\n]*react-hooks\/exhaustive-deps/.test(fs.readFileSync(file, 'utf8'))
    );
    expect(found.map(rel)).toEqual([]);
  });
});
