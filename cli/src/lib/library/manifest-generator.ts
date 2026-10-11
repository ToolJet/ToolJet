import * as ts from 'typescript';
import * as path from 'path';

export interface ManifestProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enumeration';
  default?: unknown;
  label?: string;
  description?: string;
  inspector?: string;
  enumValues?: string[]; // only present when type === 'enumeration'
  enumLabels?: Record<string, string>; // only present when type === 'enumeration'
  section?: string; // groups this prop into an Inspector accordion section by name
}

export interface ManifestEvent {
  name: string;
}

// Mirrors ActionParamDef.type in @tooljet/custom-component-sdk; each maps to an EventManager param renderer.
const ACTION_PARAM_TYPES = ['code', 'toggle', 'select', 'switch', 'color'] as const;

export interface ManifestActionParam {
  handle: string;
  displayName?: string;
  defaultValue?: unknown;
  type?: (typeof ACTION_PARAM_TYPES)[number];
  options?: { name: string; value: string }[]; // only present when type is 'select' or 'switch'
}

export interface ManifestAction {
  name: string;
  displayName?: string;
  params?: ManifestActionParam[];
}

export interface ManifestComponent {
  displayName: string;
  defaultWidth: number;
  defaultHeight: number;
  props: ManifestProp[];
  events: ManifestEvent[];
  actions: ManifestAction[];
}

export interface Manifest {
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

// Exposed variables the builder's LibraryComponent always sets; a prop or action with one of these names would clobber it.
const RESERVED_EXPOSED_NAMES = new Set(['isVisible', 'isLoading', 'setVisibility', 'setLoading']);

// Marks a value that can't be worked out without running the component.
const NOT_STATIC = Symbol('NOT_STATIC');

export interface ManifestResult {
  manifest: Manifest;
  tsErrorCount: number;
  tsErrorReport: string;
  warnings: string[];
}

export async function generateManifest(projectRoot: string): Promise<ManifestResult> {
  const entryFile = path.join(projectRoot, 'src/index.ts');
  const tsConfigPath = path.join(projectRoot, 'tsconfig.json');

  const { config, error } = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(`Invalid tsconfig.json: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(config, ts.sys, projectRoot);

  const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
  const checker = program.getTypeChecker();

  const components: Record<string, ManifestComponent> = {};
  const warnings: string[] = [];

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

    const component = walkComponentDeclaration(decl, checker, componentName, warnings);
    if (component) components[componentName] = component;
  }

  const tsErrors = ts.getPreEmitDiagnostics(program).filter((d) => d.category === ts.DiagnosticCategory.Error);

  const tsErrorReport =
    tsErrors.length > 0
      ? ts.formatDiagnosticsWithColorAndContext(tsErrors, {
          getCurrentDirectory: () => projectRoot,
          getCanonicalFileName: (f) => f,
          getNewLine: () => '\n',
        })
      : '';

  return {
    manifest: { components },
    tsErrorCount: tsErrors.length,
    tsErrorReport,
    warnings,
  };
}

function walkComponentDeclaration(
  decl: ts.Declaration,
  checker: ts.TypeChecker,
  componentName: string,
  warnings: string[]
): ManifestComponent | null {
  // Only treat exports that look like React components as components — anything
  // else (types, constants, plain helper functions) is skipped rather than showing
  // up as a phantom, prop-less component in the manifest.
  const fnNode = getFunctionLikeNode(decl);
  if (!fnNode || !fnNode.body || !containsJsx(fnNode.body)) {
    return null;
  }

  // Walk call expressions matching ToolJet.useStateXxx / useEventCallback / useAction / useComponentSettings.
  // Constraint: only top-level calls in function body (not inside nested functions/callbacks)

  const props: ManifestProp[] = [];
  const events: ManifestEvent[] = [];
  const actions: ManifestAction[] = [];
  const eventNames = new Set<string>();
  // Props and actions both land on the component's exposed variables, so they share one namespace.
  const exposedNames = new Map<string, 'prop' | 'action'>();
  let defaultWidth = 6;
  let defaultHeight = 5;

  const claimExposedName = (name: string, kind: 'prop' | 'action') => {
    if (RESERVED_EXPOSED_NAMES.has(name)) {
      throw new Error(`Name "${name}" in component "${componentName}" is reserved by ToolJet.`);
    }
    const owner = exposedNames.get(name);
    if (owner === kind) {
      throw new Error(`Duplicate ${kind} name "${name}" in component "${componentName}".`);
    }
    if (owner) {
      throw new Error(`Name "${name}" in component "${componentName}" is used by both a prop and an action.`);
    }
    exposedNames.set(name, kind);
  };

  const readOptions = (arg: ts.Expression | undefined, hookContext: string) => {
    const options = arg && resolveObjectLiteral(arg, checker);
    if (!options) {
      throw new Error(`${hookContext}: options must be an object literal or a const object.`);
    }
    return options;
  };

  const readName = (options: ts.ObjectLiteralExpression, hookContext: string) => {
    const name = readStringProp(options, 'name', checker, hookContext);
    if (!name) {
      throw new Error(`${hookContext} is missing a "name".`);
    }
    return name;
  };

  // ToolJet.useStateString({ name: 'key', initialValue: '...', inspector: 'code', ... })
  const collectProp = (node: ts.CallExpression, method: string, hookContext: string) => {
    const options = readOptions(node.arguments[0], hookContext);
    const name = readName(options, hookContext);
    const propContext = `${hookContext}, prop "${name}"`;
    claimExposedName(name, 'prop');

    const label = readStringProp(options, 'label', checker, propContext);
    const description = readStringProp(options, 'description', checker, propContext);
    const inspector = readStringProp(options, 'inspector', checker, propContext);
    const section = readStringProp(options, 'section', checker, propContext);

    let defaultValue: unknown;
    const initialValueNode = getPropNode(options, 'initialValue', checker);
    if (initialValueNode) {
      const value = evalLiteralNode(initialValueNode, checker);
      // Not an error: the component falls back to its own initialValue at runtime, only the builder default is lost.
      if (value === NOT_STATIC) {
        warnings.push(
          `Prop "${name}" in component "${componentName}": initialValue isn't a static literal, so the builder shows no default. The component still uses it at runtime.`
        );
      } else {
        defaultValue = value;
      }
    }

    let enumValues: string[] | undefined;
    const enumDefNode = getPropNode(options, 'enumDefinition', checker); // useStateEnumeration only
    if (enumDefNode) {
      const values = evalLiteralNode(enumDefNode, checker);
      if (!Array.isArray(values)) {
        throw new Error(`${propContext}: "enumDefinition" must be an array literal or a const array.`);
      }
      if (values.some((v) => typeof v !== 'string')) {
        throw new Error(
          `Invalid enumDefinition in component "${componentName}", prop "${name}": all values must be string literals.`
        );
      }
      enumValues = values;
    }

    let enumLabels: Record<string, string> | undefined;
    const enumLabelsNode = getPropNode(options, 'enumLabels', checker); // useStateEnumeration only
    if (enumLabelsNode) {
      const labels = evalLiteralNode(enumLabelsNode, checker);
      if (!isPlainObject(labels)) {
        throw new Error(`${propContext}: "enumLabels" must be an object literal or a const object.`);
      }
      enumLabels = labels as Record<string, string>;
    }

    props.push({
      name,
      type: HOOK_TYPE_MAP[method],
      default: defaultValue,
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
      ...(inspector ? { inspector } : {}),
      ...(enumValues ? { enumValues } : {}),
      ...(enumLabels ? { enumLabels } : {}),
      ...(section ? { section } : {}),
    });
  };

  // ToolJet.useEventCallback({ name: 'onClick' })
  const collectEvent = (node: ts.CallExpression, hookContext: string) => {
    const name = readName(readOptions(node.arguments[0], hookContext), hookContext);
    if (eventNames.has(name)) {
      throw new Error(`Duplicate event name "${name}" in component "${componentName}".`);
    }
    eventNames.add(name);
    events.push({ name });
  };

  // ToolJet.useAction({ name: 'setValue', params: [{ handle: 'value', type: 'code' }] }, handler)
  const collectAction = (node: ts.CallExpression, hookContext: string) => {
    const options = readOptions(node.arguments[0], hookContext);
    const name = readName(options, hookContext);
    const actionContext = `${hookContext}, action "${name}"`;
    claimExposedName(name, 'action');

    const displayName = readStringProp(options, 'displayName', checker, actionContext);
    const paramsNode = getPropNode(options, 'params', checker);
    if (paramsNode && !ts.isArrayLiteralExpression(paramsNode)) {
      throw new Error(`${actionContext}: "params" must be an array literal or a const array.`);
    }

    const params = paramsNode?.elements.map((el) => collectActionParam(el, name, actionContext));

    actions.push({
      name,
      ...(displayName ? { displayName } : {}),
      ...(params?.length ? { params } : {}),
    });
  };

  const collectActionParam = (el: ts.Expression, actionName: string, actionContext: string): ManifestActionParam => {
    const invalidParams = `Invalid params in component "${componentName}", action "${actionName}"`;

    const param = resolveObjectLiteral(el, checker);
    if (!param) {
      throw new Error(`${invalidParams}: each param must be an object literal.`);
    }
    const handle = readStringProp(param, 'handle', checker, actionContext);
    if (!handle) {
      throw new Error(`${invalidParams}: each param needs a string "handle".`);
    }
    const paramContext = `${actionContext}, param "${handle}"`;

    const paramDisplayName = readStringProp(param, 'displayName', checker, paramContext);
    const type = readStringProp(param, 'type', checker, paramContext);
    if (type && !(ACTION_PARAM_TYPES as readonly string[]).includes(type)) {
      const expected = ACTION_PARAM_TYPES.map((t) => `"${t}"`).join(', ');
      throw new Error(`${invalidParams}: param "${handle}" has type "${type}", expected one of ${expected}.`);
    }

    const defaultValueNode = getPropNode(param, 'defaultValue', checker);
    const defaultValue = defaultValueNode && evalLiteralNode(defaultValueNode, checker);
    if (defaultValue === NOT_STATIC) {
      throw new Error(`${paramContext}: "defaultValue" must be a static literal.`);
    }

    const optionsNode = getPropNode(param, 'options', checker);
    let options: { name: string; value: string }[] | undefined;
    if (optionsNode) {
      if (!ts.isArrayLiteralExpression(optionsNode)) {
        throw new Error(`${invalidParams}: param "${handle}"'s "options" must be an array literal or a const array.`);
      }
      options = optionsNode.elements.map((optEl) => {
        const option = resolveObjectLiteral(optEl, checker);
        const optionName = option && readStringProp(option, 'name', checker, paramContext);
        const optionValue = option && readStringProp(option, 'value', checker, paramContext);
        if (typeof optionName !== 'string' || typeof optionValue !== 'string') {
          throw new Error(
            `${invalidParams}: param "${handle}"'s "options" entries must be object literals with string "name" and "value".`
          );
        }
        return { name: optionName, value: optionValue };
      });
    }

    if ((type === 'select' || type === 'switch') && !options?.length) {
      throw new Error(`${invalidParams}: param "${handle}" has type "${type}" but no non-empty "options" array.`);
    }

    return {
      handle,
      ...(paramDisplayName ? { displayName: paramDisplayName } : {}),
      ...(defaultValueNode ? { defaultValue } : {}),
      ...(type ? { type: type as ManifestActionParam['type'] } : {}),
      ...(options ? { options } : {}),
    };
  };

  // ToolJet.useComponentSettings({ defaultWidth: 5, defaultHeight: 4 })
  const applySettings = (node: ts.CallExpression, hookContext: string) => {
    const [settingsArg] = node.arguments;
    if (!settingsArg) return;

    const settings = readOptions(settingsArg, hookContext);
    for (const key of ['defaultWidth', 'defaultHeight'] as const) {
      const valueNode = getPropNode(settings, key, checker);
      if (!valueNode) continue;

      const val = evalLiteralNode(valueNode, checker);
      if (typeof val !== 'number' || !Number.isInteger(val) || val <= 0) {
        throw new Error(`Invalid "${key}" in component "${componentName}": must be a positive whole number.`);
      }

      if (key === 'defaultWidth') defaultWidth = val;
      else defaultHeight = val;
    }
  };

  const visitor = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;

      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression.getText();
        const method = expr.name.getText();

        if (obj === 'ToolJet' && isToolJetSdkIdentifier(expr.expression, checker)) {
          const hookContext = `ToolJet.${method} in component "${componentName}"`;

          if (HOOK_TYPE_MAP[method]) collectProp(node, method, hookContext);
          else if (method === 'useEventCallback') collectEvent(node, hookContext);
          else if (method === 'useAction') collectAction(node, hookContext);
          else if (method === 'useComponentSettings') applySettings(node, hookContext);
        }
      }
    }

    // Don't descend into nested function scopes (callbacks, helper functions) —
    // only calls made directly in the component's own body count as top-level.
    if (!isFunctionLike(node)) {
      ts.forEachChild(node, visitor);
    }
  };

  ts.forEachChild(fnNode.body, visitor);

  return {
    displayName: toDisplayName(componentName),
    defaultWidth,
    defaultHeight,
    props,
    events,
    actions,
  };
}

// Searches the whole subtree (including nested helper closures, e.g. a component
// that builds its JSX via nested renderX() functions before returning it) for any
// JSX node — used as a lightweight signal that a declaration is a React component.
function containsJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;

  return !!ts.forEachChild(node, (child) => (containsJsx(child) ? true : undefined));
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

// Follows parentheses, `as const`/`satisfies` and const bindings (including imports) back to
// the expression they name. Anything else (let, calls, parameters) is returned unchanged.
function resolveStaticNode(node: ts.Expression, checker: ts.TypeChecker): ts.Expression {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    return resolveStaticNode(node.expression, checker);
  }

  if (ts.isIdentifier(node)) {
    return resolveConstSymbol(checker.getSymbolAtLocation(node), checker) ?? node;
  }

  return node;
}

function resolveConstSymbol(symbol: ts.Symbol | undefined, checker: ts.TypeChecker): ts.Expression | undefined {
  const target = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const decl = target?.declarations?.[0];

  if (
    decl &&
    ts.isVariableDeclaration(decl) &&
    decl.initializer &&
    ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const
  ) {
    return resolveStaticNode(decl.initializer, checker);
  }

  return undefined;
}

// Resolves `node` to an object literal whose spreads all resolve too, so every key can be read statically.
function resolveObjectLiteral(node: ts.Expression, checker: ts.TypeChecker): ts.ObjectLiteralExpression | undefined {
  const resolved = resolveStaticNode(node, checker);
  if (!ts.isObjectLiteralExpression(resolved)) return undefined;

  const spreadsResolve = resolved.properties.every(
    (prop) => !ts.isSpreadAssignment(prop) || resolveObjectLiteral(prop.expression, checker)
  );

  return spreadsResolve ? resolved : undefined;
}

function getPropertyKey(prop: ts.ObjectLiteralElementLike): string | undefined {
  const name = prop.name;
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined;
}

// The resolved value of a `key: value` or shorthand `{ key }` property; undefined for methods and accessors.
function getPropertyValue(prop: ts.ObjectLiteralElementLike, checker: ts.TypeChecker): ts.Expression | undefined {
  if (ts.isPropertyAssignment(prop)) return resolveStaticNode(prop.initializer, checker);

  if (ts.isShorthandPropertyAssignment(prop)) {
    return resolveConstSymbol(checker.getShorthandAssignmentValueSymbol(prop), checker) ?? prop.name;
  }

  return undefined;
}

// Expects `obj` from resolveObjectLiteral, so every spread in it resolves. Later keys win, as in JS.
function getPropNode(obj: ts.ObjectLiteralExpression, key: string, checker: ts.TypeChecker): ts.Expression | undefined {
  for (const prop of [...obj.properties].reverse()) {
    if (ts.isSpreadAssignment(prop)) {
      const spread = resolveObjectLiteral(prop.expression, checker);
      const found = spread && getPropNode(spread, key, checker);
      if (found) return found;
    } else if (getPropertyKey(prop) === key) {
      return getPropertyValue(prop, checker);
    }
  }

  return undefined;
}

// Returns undefined when `key` is absent and throws when it is present but not a static string.
function readStringProp(
  obj: ts.ObjectLiteralExpression,
  key: string,
  checker: ts.TypeChecker,
  context: string
): string | undefined {
  const node = getPropNode(obj, key, checker);
  if (!node) return undefined;

  if (ts.isStringLiteralLike(node)) return node.text;

  throw new Error(`${context}: "${key}" must be a string literal or a const string.`);
}

function toDisplayName(name: string): string {
  // 'MyComponent' → 'My Component', 'QRCodeGenerator' → 'QR Code Generator'
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Folds a literal (or const-bound) expression to its JSON value, or NOT_STATIC if any part of it needs the code to run.
function evalLiteralNode(expression: ts.Expression, checker: ts.TypeChecker): unknown {
  const node = resolveStaticNode(expression, checker);

  if (ts.isStringLiteralLike(node)) return node.text;

  if (ts.isNumericLiteral(node)) return parseFloat(node.text);

  // TypeScript represents negative/positive numeric literals (`-1`, `+1`) as a
  // PrefixUnaryExpression wrapping a NumericLiteral, not as a NumericLiteral itself.
  if (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) &&
    ts.isNumericLiteral(node.operand)
  ) {
    const value = parseFloat(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;

  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;

  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isIdentifier(node) && node.text === 'undefined') return undefined;

  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        const spread = evalLiteralNode(prop.expression, checker);
        if (!isPlainObject(spread)) return NOT_STATIC;
        Object.assign(result, spread);
        continue;
      }

      const key = getPropertyKey(prop);
      const valueNode = getPropertyValue(prop, checker);
      if (key === undefined || !valueNode) return NOT_STATIC;

      const value = evalLiteralNode(valueNode, checker);
      if (value === NOT_STATIC) return NOT_STATIC;
      result[key] = value;
    }
    return result;
  }

  if (ts.isArrayLiteralExpression(node)) {
    const result: unknown[] = [];
    for (const element of node.elements) {
      const value = evalLiteralNode(ts.isSpreadElement(element) ? element.expression : element, checker);
      if (value === NOT_STATIC) return NOT_STATIC;

      if (!ts.isSpreadElement(element)) result.push(value);
      else if (Array.isArray(value)) result.push(...value);
      else return NOT_STATIC;
    }
    return result;
  }

  // Calls, arithmetic, let bindings, parameters, ... — can't be known without running the component.
  return NOT_STATIC;
}
