import * as ts from 'typescript';
import * as path from 'path';

export interface ManifestProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enumeration';
  default?: unknown;
  enumValues?: string[];  // only present when type === 'enumeration'
}

export interface ManifestEvent { name: string; }

export interface ManifestComponent {
  displayName: string;
  defaultWidth: number;
  defaultHeight: number;
  props: ManifestProp[];
  events: ManifestEvent[];
}

export interface Manifest {
  schemaVersion: '1';
  components: Record<string, ManifestComponent>;
}

// Hook name → prop type mapping
const HOOK_TYPE_MAP: Record<string, ManifestProp['type']> = {
  useStateString: 'string',
  useStateNumber: 'number',
  useStateBoolean: 'boolean',
  useStateObject: 'object',
  useStateArray: 'array',
  useStateEnumeration: 'enumeration',
};

export async function generateManifest(projectRoot: string): Promise<Manifest> {
  const entryFile = path.join(projectRoot, 'src/index.ts');
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  const { config } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  const { options } = ts.convertCompilerOptionsFromJson(config.compilerOptions, projectRoot);

  const program = ts.createProgram([entryFile], options);
  const checker = program.getTypeChecker();

  const components: Record<string, ManifestComponent> = {};

  // Walk exports of src/index.ts
  const sourceFile = program.getSourceFile(entryFile)!;
  const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(sourceFile)!);

  for (const exportSymbol of exports) {
    const componentName = exportSymbol.getName();
    const decl = exportSymbol.declarations?.[0];
    if (!decl) continue;

    const component = walkComponentDeclaration(decl, checker, componentName);
    if (component) components[componentName] = component;
  }

  return { schemaVersion: '1', components };
}

function walkComponentDeclaration(
  decl: ts.Declaration,
  checker: ts.TypeChecker,
  name: string
): ManifestComponent | null {
  // Find the function body of the exported component
  // Walk call expressions matching ToolJet.useStateXxx / useEventCallback / useComponentSettings
  // Constraint: only top-level calls in function body (not nested)

  const props: ManifestProp[] = [];
  const events: ManifestEvent[] = [];
  let defaultWidth = 6;
  let defaultHeight = 5;

  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression.getText();
        const method = expr.name.getText();

        if (obj === 'ToolJet' && HOOK_TYPE_MAP[method]) {
          // ToolJet.useStateString({ name: 'key', initialValue: '...', inspector: 'text', ... })
          const [optionsArg] = node.arguments;
          if (ts.isObjectLiteralExpression(optionsArg)) {
            const name = getStringProp(optionsArg, 'name');
            const initialValue = getPropNode(optionsArg, 'initialValue');
            const enumDef = getPropNode(optionsArg, 'enumDefinition'); // useStateEnumeration only

            if (name) {
              props.push({
                name,
                type: HOOK_TYPE_MAP[method],
                default: initialValue ? evalLiteralNode(initialValue) : undefined,
                // For enumerations, also record the allowed values
                ...(enumDef && ts.isArrayLiteralExpression(enumDef)
                  ? { enumValues: enumDef.elements.map(e => (e as ts.StringLiteral).text) }
                  : {}),
              });
            }
          }
        }

        if (obj === 'ToolJet' && method === 'useEventCallback') {
          // ToolJet.useEventCallback({ name: 'onClick' })
          const [optionsArg] = node.arguments;
          if (ts.isObjectLiteralExpression(optionsArg)) {
            const name = getStringProp(optionsArg, 'name');

            if (name) events.push({ name });
          }
        }

        if (obj === 'ToolJet' && method === 'useComponentSettings') {
          // ToolJet.useComponentSettings({ defaultWidth: 5, defaultHeight: 4 })
          const [settingsArg] = node.arguments;
          if (ts.isObjectLiteralExpression(settingsArg)) {
            for (const prop of settingsArg.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const key = (prop.name as ts.Identifier).text;
                const val = evalLiteralNode(prop.initializer);

                if (key === 'defaultWidth') defaultWidth = val as number;
                if (key === 'defaultHeight') defaultHeight = val as number;
              }
            }
          }
        }
      }
    }
    // Only descend into the top-level function body
    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(decl, visitor);

  if (props.length === 0 && events.length === 0) return null;

  return {
    displayName: toDisplayName(name),
    defaultWidth,
    defaultHeight,
    props,
    events,
  };
}

function getPropNode(obj: ts.ObjectLiteralExpression, key: string): ts.Expression | undefined {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;

    const propName = prop.name;
    const propKey = ts.isIdentifier(propName) || ts.isStringLiteral(propName) ? propName.text : undefined;

    if (propKey === key) return prop.initializer;
  }

  return undefined;
}

function getStringProp(obj: ts.ObjectLiteralExpression, key: string): string | undefined {
  const node = getPropNode(obj, key);

  return node && ts.isStringLiteral(node) ? node.text : undefined;
}

function toDisplayName(name: string): string {
  // 'MyComponent' → 'My Component'
  return name.replace(/([A-Z])/g, ' $1').trim();
}

function evalLiteralNode(node: ts.Node): unknown {
  if (ts.isStringLiteral(node)) return node.text;

  if (ts.isNumericLiteral(node)) return parseFloat(node.text);

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;

  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

  if (ts.isObjectLiteralExpression(node)) return {};

  if (ts.isArrayLiteralExpression(node)) return [];

  return null;
}
