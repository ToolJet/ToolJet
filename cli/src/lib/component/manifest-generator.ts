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

const TOOLJET_SDK_MODULE = '@tooljet/custom-component-sdk';

// Hook name → prop type mapping
const HOOK_TYPE_MAP: Record<string, ManifestProp['type']> = {
  useStateString: 'string',
  useStateNumber: 'number',
  useStateBoolean: 'boolean',
  useStateObject: 'object',
  useStateArray: 'array',
  useStateEnumeration: 'enumeration',
};

export async function generateManifest(
  projectRoot: string
): Promise<{ manifest: Manifest; tsErrorCount: number }> {
  const entryFile = path.join(projectRoot, 'src/index.ts');
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(`Invalid tsconfig.json: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
  }

  const { options } = ts.convertCompilerOptionsFromJson(config.compilerOptions, projectRoot);

  const program = ts.createProgram([entryFile], options);
  const checker = program.getTypeChecker();

  const components: Record<string, ManifestComponent> = {};

  // Walk exports of src/index.ts
  const sourceFile = program.getSourceFile(entryFile);
  if (!sourceFile) {
    throw new Error(`Could not find ${entryFile}. Make sure src/index.ts exists.`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`No exports found in ${entryFile}.`);
  }

  const exports = checker.getExportsOfModule(moduleSymbol);

  for (const exportSymbol of exports) {
    const componentName = exportSymbol.getName();

    // Follow re-exports (`export { X } from './Y'`) to the real declaration —
    // an aliased symbol's own declarations point at the ExportSpecifier, not the
    // function body, so there'd be nothing to walk without this resolution.
    const resolvedSymbol =
      exportSymbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exportSymbol) : exportSymbol;

    const decl = resolvedSymbol.declarations?.[0];
    if (!decl) continue;

    const component = walkComponentDeclaration(decl, checker, componentName);
    if (component) components[componentName] = component;
  }

  const tsErrorCount = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.category === ts.DiagnosticCategory.Error).length;

  return { manifest: { schemaVersion: '1', components }, tsErrorCount };
}

function walkComponentDeclaration(
  decl: ts.Declaration,
  checker: ts.TypeChecker,
  componentName: string
): ManifestComponent | null {
  // Find the function body of the exported component
  // Walk call expressions matching ToolJet.useStateXxx / useEventCallback / useComponentSettings
  // Constraint: only top-level calls in function body (not inside nested functions/callbacks)

  const props: ManifestProp[] = [];
  const events: ManifestEvent[] = [];
  const propNames = new Set<string>();
  const eventNames = new Set<string>();
  let defaultWidth = 6;
  let defaultHeight = 5;

  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression.getText();
        const method = expr.name.getText();

        if (obj === 'ToolJet' && isToolJetSdkIdentifier(expr.expression, checker)) {
          if (HOOK_TYPE_MAP[method]) {
            // ToolJet.useStateString({ name: 'key', initialValue: '...', inspector: 'text', ... })
            const [optionsArg] = node.arguments;
            if (ts.isObjectLiteralExpression(optionsArg)) {
              const name = getStringProp(optionsArg, 'name');
              const initialValue = getPropNode(optionsArg, 'initialValue');
              const enumDef = getPropNode(optionsArg, 'enumDefinition'); // useStateEnumeration only

              if (name) {
                if (propNames.has(name)) {
                  throw new Error(`Duplicate prop name "${name}" in component "${componentName}".`);
                }
                propNames.add(name);

                let enumValues: string[] | undefined;
                if (enumDef && ts.isArrayLiteralExpression(enumDef)) {
                  const invalid = enumDef.elements.find((e) => !ts.isStringLiteral(e));
                  if (invalid) {
                    throw new Error(
                      `Invalid enumDefinition in component "${componentName}", prop "${name}": all values must be string literals.`
                    );
                  }
                  enumValues = enumDef.elements.map((e) => (e as ts.StringLiteral).text);
                }

                props.push({
                  name,
                  type: HOOK_TYPE_MAP[method],
                  default: initialValue ? evalLiteralNode(initialValue) : undefined,
                  ...(enumValues ? { enumValues } : {}),
                });
              }
            }
          }

          if (method === 'useEventCallback') {
            // ToolJet.useEventCallback({ name: 'onClick' })
            const [optionsArg] = node.arguments;
            if (ts.isObjectLiteralExpression(optionsArg)) {
              const name = getStringProp(optionsArg, 'name');

              if (name) {
                if (eventNames.has(name)) {
                  throw new Error(`Duplicate event name "${name}" in component "${componentName}".`);
                }
                eventNames.add(name);
                events.push({ name });
              }
            }
          }

          if (method === 'useComponentSettings') {
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
    }

    // Don't descend into nested function scopes (callbacks, helper functions) —
    // only calls made directly in the component's own body count as top-level.
    if (!isFunctionLike(node)) {
      ts.forEachChild(node, visitor);
    }
  };

  const fnNode = getFunctionLikeNode(decl);
  const bodyNode = fnNode?.body ?? decl;

  ts.forEachChild(bodyNode, visitor);

  return {
    displayName: toDisplayName(componentName),
    defaultWidth,
    defaultHeight,
    props,
    events,
  };
}

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node)
  );
}

function getFunctionLikeNode(
  decl: ts.Declaration
): ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | undefined {
  if (ts.isFunctionDeclaration(decl)) return decl;

  if (ts.isVariableDeclaration(decl) && decl.initializer) {
    if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
      return decl.initializer;
    }
  }

  return undefined;
}

// Confirms `expr` resolves to the real `ToolJet` binding imported from the SDK,
// rather than an unrelated local variable/parameter that happens to be named `ToolJet`.
// Renamed/namespace imports (`import * as TJ`, `import { ToolJet as TJ }`) are not matched —
// this only guards against shadowing of the literal `ToolJet` name.
function isToolJetSdkIdentifier(expr: ts.Expression, checker: ts.TypeChecker): boolean {
  const symbol = checker.getSymbolAtLocation(expr);
  const decl = symbol?.declarations?.[0];
  if (!decl || !(ts.isImportSpecifier(decl) || ts.isNamespaceImport(decl))) return false;

  let node: ts.Node = decl;
  while (node && !ts.isImportDeclaration(node)) node = node.parent;

  return (
    !!node &&
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === TOOLJET_SDK_MODULE
  );
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

  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;

      const propName = prop.name;
      const key = ts.isIdentifier(propName) || ts.isStringLiteral(propName) ? propName.text : undefined;
      if (key === undefined) continue;

      result[key] = evalLiteralNode(prop.initializer);
    }
    return result;
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((e) => evalLiteralNode(e));
  }

  // Non-literal expression (identifier, call, spread, ...) — value can't be
  // statically determined.
  return undefined;
}
