// The UI 2.0 widget configs are written by hand, one file per widget in WidgetManager/widgets, like the native configs.
// Other tools read these files without running them (the MCP server's component catalog parses them), so each must
// stay one plain object literal; and every widget must carry the standard control actions and values.
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import { shadcnConfigs, SHADCN_COMPONENTS } from '../../../WidgetManager/widgets/shadcn';

const DIR = path.resolve(__dirname, '../../../WidgetManager/widgets');
const files = fs.readdirSync(DIR).filter((f) => /^shad[A-Z]\w*\.(js|ts)$/.test(f));

/** Why a node is not a plain literal (a call, a spread, a variable), or null. */
const notLiteral = (node) => {
  switch (node.type) {
    case 'ObjectExpression':
      for (const p of node.properties) {
        if (p.type !== 'ObjectProperty' || p.computed) return `${p.type} at line ${p.loc.start.line}`;
        const why = notLiteral(p.value);
        if (why) return why;
      }
      return null;
    case 'ArrayExpression':
      for (const e of node.elements) {
        const why = e && notLiteral(e);
        if (why) return why;
      }
      return null;
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
      return null;
    case 'TemplateLiteral':
      return node.expressions.length ? `template expression at line ${node.loc.start.line}` : null;
    case 'UnaryExpression':
      return node.operator === '-' && node.argument.type === 'NumericLiteral' ? null : `${node.type}`;
    default:
      return `${node.type} at line ${node.loc.start.line}`;
  }
};

describe('UI 2.0 widget config files', () => {
  it('are all listed in the widgets/shadcn.js index, and the index lists no other', () => {
    const listed = shadcnConfigs.map((c) => `${c.name[0].toLowerCase()}${c.name.slice(1)}`).sort();
    expect(files.map((f) => f.replace(/\.(js|ts)$/, '')).sort()).toEqual(listed);
    expect(SHADCN_COMPONENTS).toEqual(shadcnConfigs.map((c) => c.name));
  });

  it.each(files)('%s is one exported object literal with no imports', (file) => {
    const ast = parse(fs.readFileSync(path.join(DIR, file), 'utf8'), {
      sourceType: 'module',
      plugins: ['typescript'],
    });
    const body = ast.program.body;
    expect(body.filter((n) => n.type === 'ImportDeclaration')).toEqual([]);
    expect(body).toHaveLength(1);
    const [decl] = body[0].declaration.declarations;
    expect(notLiteral(decl.init)).toBeNull();
  });

  it.each(shadcnConfigs.filter((c) => c.name !== 'ShadDialog').map((c) => [c.name, c]))(
    '%s has the standard control actions and exposed values',
    (name, config) => {
      const actions = (config.actions || []).map((a) => a.handle);
      expect(actions).toEqual(expect.arrayContaining(['setVisibility', 'setDisable', 'setLoading']));
      expect(Object.keys(config.exposedVariables || {})).toEqual(
        expect.arrayContaining(['isVisible', 'isDisabled', 'isLoading'])
      );
      expect(config.component).toBe(name);
    }
  );
});
