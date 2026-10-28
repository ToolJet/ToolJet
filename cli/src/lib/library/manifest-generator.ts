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
  exposed?: boolean; // styles only: also set as a read-only exposed variable (useStyleX `expose: true`)
  placeholder?: string;
  min?: number;
  max?: number;
  visibleWhen?: ManifestVisibleWhen; // Inspector shows the field only while prop `key` equals `value`
  iconSet?: 'tabler' | 'lucide'; // the icon set an `inspector: 'icon'` prop's picker offers
}

export interface ManifestVisibleWhen {
  key: string;
  value: unknown;
}

// Which native validation fields the Inspector offers: text inputs get them all, choice and date controls only
// mandatory and a custom rule.
const VALIDATION_KINDS = ['text', 'choice', 'date'] as const;
export type ManifestValidationKind = (typeof VALIDATION_KINDS)[number];

export interface ManifestEvent {
  name: string;
  displayName?: string;
}

// Drop areas: a Slot (a container area), RowSlot (a canvas per useRows item) or PopupSlot (inside a popup).
const SLOT_KINDS = ['slot', 'rows', 'popup'] as const;
export interface ManifestSlot {
  name: string;
  kind: (typeof SLOT_KINDS)[number];
  variable?: string; // rows only: what the row's components call their item instead of {{listItem}}
}

const SLOT_COMPONENT_KINDS: Record<string, ManifestSlot['kind']> = {
  Slot: 'slot',
  RowSlot: 'rows',
  PopupSlot: 'popup',
};

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
  styles: ManifestProp[]; // Inspector Styles tab; never exposed variables
  events: ManifestEvent[];
  actions: ManifestAction[];
  validation?: ManifestValidationKind; // set when the component calls ToolJet.useValidation
  role?: string; // the native widget this component stands in for (e.g. 'stat'), from useComponentSettings
  fit?: boolean; // grows to its content when the builder turns on dynamic height, from useComponentSettings
  loading?: 'own'; // the component draws its own loading look, so the host draws no overlay
  usage?: string; // when to use the component, for the AI app builder
  controlState?: boolean; // the component calls useControlState, so the Inspector offers Disable
  slots?: ManifestSlot[];
  // How the component names the props, events and actions of the native widget it stands in for (its `role`), and
  // the values a role prop takes: the AI app builder plans in native widgets and maps them through these.
  roleProps?: Record<string, string>;
  roleValues?: Record<string, Record<string, RoleValue>>;
  roleEvents?: Record<string, string>;
  roleActions?: Record<string, string>;
  labelCase?: 'upper'; // the component writes its label in capitals, so a layout sized for its text widens it
}

// Library-wide settings, from .tooljet/config.json.
export interface ManifestLibrarySettings {
  themeMode?: 'own'; // drawn in its own design system: takes the app theme only once one is applied
  surface?: Record<string, unknown>; // the page and card look layouts around its components should match
}

export interface Manifest extends ManifestLibrarySettings {
  components: Record<string, ManifestComponent>;
}

// The role mappings useComponentSettings takes: a name → name map, and roleValues a map of those per prop.
const ROLE_MAPS = ['roleProps', 'roleEvents', 'roleActions'] as const;
export type RoleMap = (typeof ROLE_MAPS)[number];

const isStringMap = (value: unknown): value is Record<string, string> =>
  isPlainObject(value) && Object.values(value).every((v) => typeof v === 'string');

type RoleScalar = string | number | boolean;
// A role prop's value in this component: one value, or several props set together ({ variant: 'text', color: 'inherit' }).
export type RoleValue = RoleScalar | Record<string, RoleScalar>;

const isRoleScalar = (value: unknown): value is RoleScalar => ['string', 'number', 'boolean'].includes(typeof value);

const isValueMap = (value: unknown): value is Record<string, RoleValue> =>
  isPlainObject(value) &&
  Object.values(value).every((v) => isRoleScalar(v) || (isPlainObject(v) && Object.values(v).every(isRoleScalar)));

/** Throws unless `settings` holds valid role mappings and labelCase; returns the ones it holds. */
export function readRoleSettings(
  settings: Record<string, unknown>,
  componentName: string
): Pick<ManifestComponent, RoleMap | 'roleValues' | 'labelCase'> {
  const out: Pick<ManifestComponent, RoleMap | 'roleValues' | 'labelCase'> = {};
  for (const key of ROLE_MAPS) {
    const value = settings[key];
    if (value === undefined) continue;
    if (!isStringMap(value)) {
      throw new Error(`Invalid "${key}" in component "${componentName}": must map names to names.`);
    }
    out[key] = value;
  }
  if (settings.roleValues !== undefined) {
    const value = settings.roleValues;
    if (!isPlainObject(value) || !Object.values(value).every(isValueMap)) {
      throw new Error(`Invalid "roleValues" in component "${componentName}": must map each prop to a map of values.`);
    }
    out.roleValues = value as Record<string, Record<string, RoleValue>>;
  }
  if (settings.labelCase !== undefined) {
    if (settings.labelCase !== 'upper') {
      throw new Error(`Invalid "labelCase" in component "${componentName}": must be 'upper'.`);
    }
    out.labelCase = 'upper';
  }
  return out;
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

// Style hook name → value type; styles share ManifestProp's shape but live in their own list.
const STYLE_HOOK_TYPE_MAP: Record<string, ManifestProp['type']> = {
  useStyleString: 'string',
  useStyleNumber: 'number',
  useStyleBoolean: 'boolean',
  useStyleEnumeration: 'enumeration',
};

// Everything that becomes an exposed variable, in the order clash messages name them.
const EXPOSED_KINDS = ['prop', 'action', 'exposed style'] as const;
type ExposedKind = (typeof EXPOSED_KINDS)[number];

const withArticle = (kind: string) => (/^[aeiou]/.test(kind) ? `an ${kind}` : `a ${kind}`);

// Styles the builder's LibraryComponent applies itself; a style with one of these names would collide with it.
const RESERVED_STYLE_NAMES = new Set(['boxShadow']);

// Exposed variables the builder's LibraryComponent always sets; a prop or action with one of these names would clobber it.
const RESERVED_EXPOSED_NAMES = new Set(['isVisible', 'isLoading', 'setVisibility', 'setLoading']);

// Exposed variables the builder also sets on a component that calls ToolJet.useValidation.
const VALIDATION_EXPOSED_NAMES = ['isValid', 'isMandatory'];

// Marks a value that can't be worked out without running the component.
const NOT_STATIC = Symbol('NOT_STATIC');

export interface ManifestResult {
  manifest: Manifest;
  /** Per component, the project's own functions it calls that use ToolJet hooks: fields reading alone can't see. */
  helperDeclared: Record<string, string[]>;
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
  const helperDeclared: Record<string, string[]> = {};

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
    if (component) {
      components[componentName] = component;
      const helpers = sdkHelpersCalledBy(decl, checker);
      if (helpers.length) helperDeclared[componentName] = helpers;
    }
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
    helperDeclared,
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
  // A hook (useX) is never a component, even when it returns JSX for the components that call it.
  if (/^use[A-Z]/.test(componentName)) return null;
  const fnNode = getFunctionLikeNode(decl);
  const isComponent =
    !!fnNode?.body && (containsJsx(fnNode.body) || (isPascalCase(componentName) && callsHook(fnNode.body)));
  if (!fnNode || !isComponent) {
    return null;
  }

  // Walk call expressions matching ToolJet.useStateXxx / useEventCallback / useAction / useComponentSettings.
  // Constraint: only top-level calls in function body (not inside nested functions/callbacks)

  const props: ManifestProp[] = [];
  const styles: ManifestProp[] = [];
  const styleNames = new Set<string>();
  const events: ManifestEvent[] = [];
  const actions: ManifestAction[] = [];
  const eventNames = new Set<string>();
  // Props, actions and exposed styles all land on the component's exposed variables, so they share one namespace.
  const exposedNames = new Map<string, ExposedKind>();
  let defaultWidth = 6;
  let defaultHeight = 5;
  let role: string | undefined;
  let fit: boolean | undefined;
  let validation: ManifestValidationKind | undefined;
  let loading: 'own' | undefined;
  let usage: string | undefined;
  let controlState = false;
  let roleSettings: ReturnType<typeof readRoleSettings> = {};
  const slots: ManifestSlot[] = [];
  const addSlot = (slot: ManifestSlot) => {
    if (!slots.some((s) => s.name === slot.name && s.kind === slot.kind)) slots.push(slot);
  };
  // visibleWhen keys are checked once every prop is collected, so a field may name a prop declared after it.
  const visibleWhenKeys: { key: string; context: string }[] = [];

  const claimExposedName = (name: string, kind: ExposedKind) => {
    if (RESERVED_EXPOSED_NAMES.has(name)) {
      throw new Error(`Name "${name}" in component "${componentName}" is reserved by ToolJet.`);
    }
    const owner = exposedNames.get(name);
    if (owner === kind) {
      throw new Error(`Duplicate ${kind} name "${name}" in component "${componentName}".`);
    }
    if (owner) {
      const [first, second] = EXPOSED_KINDS.filter((k) => k === owner || k === kind);
      throw new Error(
        `Name "${name}" in component "${componentName}" is used by both ${withArticle(first)} and ${withArticle(
          second
        )}.`
      );
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

  // Styles aren't exposed, so they only need to be unique among themselves.
  const claimStyleName = (name: string) => {
    if (RESERVED_STYLE_NAMES.has(name)) {
      throw new Error(`Style name "${name}" in component "${componentName}" is reserved by ToolJet.`);
    }
    if (styleNames.has(name)) {
      throw new Error(`Duplicate style name "${name}" in component "${componentName}".`);
    }
    styleNames.add(name);
  };

  // ToolJet.useStateString({ name: 'key', initialValue: '...', inspector: 'code', ... })
  // ToolJet.useStyleString({ name: 'key', initialValue: '...', inspector: 'color', ... }) — same options, kind 'style'
  const collectProp = (node: ts.CallExpression, method: string, hookContext: string, kind: 'prop' | 'style') => {
    const options = readOptions(node.arguments[0], hookContext);
    const name = readName(options, hookContext);
    const propContext = `${hookContext}, ${kind} "${name}"`;
    let exposed = false;
    if (kind === 'style') {
      claimStyleName(name);
      const exposeNode = getPropNode(options, 'expose', checker);
      const expose = exposeNode ? evalLiteralNode(exposeNode, checker) : false;
      if (typeof expose !== 'boolean') {
        throw new Error(`${propContext}: "expose" must be true or false.`);
      }
      exposed = expose;
      if (exposed) claimExposedName(name, 'exposed style');
    } else {
      claimExposedName(name, 'prop');
    }

    // Display text built at runtime (a list joined into a description) is read from the render (manifest-recorder.ts).
    const readText = (key: 'label' | 'description' | 'placeholder') => {
      const node = getPropNode(options, key, checker);
      const value = node ? evalLiteralNode(node, checker) : undefined;
      if (value === undefined || typeof value === 'string') return value;
      if (value !== NOT_STATIC) throw new Error(`${propContext}: "${key}" must be a string.`);
      warnings.push(
        `${
          kind === 'style' ? 'Style' : 'Prop'
        } "${name}" in component "${componentName}": ${key} isn't a static string, so the builder shows none.`
      );
      return undefined;
    };
    const label = readText('label');
    const description = readText('description');
    const inspector = readStringProp(options, 'inspector', checker, propContext);
    const section = readStringProp(options, 'section', checker, propContext);
    const placeholder = readText('placeholder');
    const min = readNumberProp(options, 'min', checker, propContext);
    const max = readNumberProp(options, 'max', checker, propContext);
    if (min !== undefined && max !== undefined && min > max) {
      throw new Error(`${propContext}: "min" is above "max".`);
    }
    const visibleWhen = readVisibleWhen(options, checker, propContext);
    const iconSet = readStringProp(options, 'iconSet', checker, propContext);
    if (iconSet !== undefined && iconSet !== 'tabler' && iconSet !== 'lucide') {
      throw new Error(`${propContext}: "iconSet" must be 'tabler' or 'lucide'.`);
    }
    if (visibleWhen) visibleWhenKeys.push({ key: visibleWhen.key, context: propContext });

    let defaultValue: unknown;
    const initialValueNode = getPropNode(options, 'initialValue', checker);
    if (initialValueNode) {
      const value = evalLiteralNode(initialValueNode, checker);
      // Not an error: the component falls back to its own initialValue at runtime, only the builder default is lost.
      if (value === NOT_STATIC) {
        warnings.push(
          `${
            kind === 'style' ? 'Style' : 'Prop'
          } "${name}" in component "${componentName}": initialValue isn't a static literal, so the builder shows no default. The component still uses it at runtime.`
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
          `Invalid enumDefinition in component "${componentName}", ${kind} "${name}": all values must be string literals.`
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

    (kind === 'style' ? styles : props).push({
      name,
      type: kind === 'style' ? STYLE_HOOK_TYPE_MAP[method] : HOOK_TYPE_MAP[method],
      default: defaultValue,
      ...(label ? { label } : {}),
      ...(description ? { description } : {}),
      ...(inspector ? { inspector } : {}),
      ...(enumValues ? { enumValues } : {}),
      ...(enumLabels ? { enumLabels } : {}),
      ...(section ? { section } : {}),
      ...(exposed ? { exposed } : {}),
      ...(placeholder ? { placeholder } : {}),
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
      ...(visibleWhen ? { visibleWhen } : {}),
      ...(iconSet ? { iconSet: iconSet as 'tabler' | 'lucide' } : {}),
    });
  };

  // ToolJet.useEventCallback({ name: 'onClick' })
  const collectEvent = (node: ts.CallExpression, hookContext: string) => {
    const options = readOptions(node.arguments[0], hookContext);
    const name = readName(options, hookContext);
    if (eventNames.has(name)) {
      throw new Error(`Duplicate event name "${name}" in component "${componentName}".`);
    }
    eventNames.add(name);
    const displayName = readStringProp(options, 'displayName', checker, `${hookContext}, event "${name}"`);
    events.push({ name, ...(displayName ? { displayName } : {}) });
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

  // ToolJet.useValidation({ kind: 'text', value }): the value is read at runtime, only the kind is static.
  const collectValidation = (node: ts.CallExpression, hookContext: string) => {
    if (validation) {
      throw new Error(`ToolJet.useValidation is called more than once in component "${componentName}".`);
    }
    const kind = readStringProp(readOptions(node.arguments[0], hookContext), 'kind', checker, hookContext) ?? 'text';
    if (!(VALIDATION_KINDS as readonly string[]).includes(kind)) {
      throw new Error(`${hookContext}: "kind" must be 'text', 'choice' or 'date'.`);
    }
    validation = kind as ManifestValidationKind;
  };

  // ToolJet.useComponentSettings({ defaultWidth: 5, defaultHeight: 4, role: 'stat', fit: true })
  const applySettings = (node: ts.CallExpression, hookContext: string) => {
    const [settingsArg] = node.arguments;
    if (!settingsArg) return;

    const settings = readOptions(settingsArg, hookContext);
    role = readStringProp(settings, 'role', checker, hookContext);
    usage = readStringProp(settings, 'usage', checker, hookContext);
    const loadingValue = readStringProp(settings, 'loading', checker, hookContext);
    if (loadingValue !== undefined && loadingValue !== 'own') {
      throw new Error(`Invalid "loading" in component "${componentName}": must be 'own'.`);
    }
    loading = loadingValue;
    const slotsNode = getPropNode(settings, 'slots', checker);
    if (slotsNode) {
      const declared = evalLiteralNode(slotsNode, checker);
      const valid =
        Array.isArray(declared) &&
        declared.every(
          (slot) =>
            isPlainObject(slot) &&
            typeof slot.name === 'string' &&
            (SLOT_KINDS as readonly unknown[]).includes(slot.kind) &&
            (slot.variable === undefined || typeof slot.variable === 'string')
        );
      if (!valid) {
        throw new Error(
          `Invalid "slots" in component "${componentName}": each needs a "name" and a "kind" of 'slot', 'rows' or 'popup'.`
        );
      }
      (declared as ManifestSlot[]).forEach(addSlot);
    }
    const roleValuesRead: Record<string, unknown> = {};
    for (const key of [...ROLE_MAPS, 'roleValues', 'labelCase']) {
      const node = getPropNode(settings, key, checker);
      if (!node) continue;
      const value = evalLiteralNode(node, checker);
      if (value === NOT_STATIC) {
        throw new Error(`Invalid "${key}" in component "${componentName}": must be a static literal.`);
      }
      roleValuesRead[key] = value;
    }
    roleSettings = readRoleSettings(roleValuesRead, componentName);
    const fitNode = getPropNode(settings, 'fit', checker);
    if (fitNode) {
      const val = evalLiteralNode(fitNode, checker);
      if (typeof val !== 'boolean') {
        throw new Error(`Invalid "fit" in component "${componentName}": must be true or false.`);
      }
      fit = val;
    }

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

          if (HOOK_TYPE_MAP[method]) collectProp(node, method, hookContext, 'prop');
          else if (STYLE_HOOK_TYPE_MAP[method]) collectProp(node, method, hookContext, 'style');
          else if (method === 'useEventCallback') collectEvent(node, hookContext);
          else if (method === 'useAction') collectAction(node, hookContext);
          else if (method === 'useComponentSettings') applySettings(node, hookContext);
          else if (method === 'useValidation') collectValidation(node, hookContext);
          else if (method === 'useControlState') controlState = true;
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

  // Drop areas are JSX, often drawn inside a .map or a render helper, so the whole body is searched.
  const slotVisitor = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName;
      const kind = ts.isPropertyAccessExpression(tag) && SLOT_COMPONENT_KINDS[tag.name.getText()];
      if (kind && isToolJetSdkIdentifier(tag.expression, checker)) {
        const attr = (key: string) => {
          const found = node.attributes.properties.find(
            (a): a is ts.JsxAttribute => ts.isJsxAttribute(a) && a.name.getText() === key
          );
          const init = found?.initializer;
          if (!init) return undefined;
          if (ts.isStringLiteral(init)) return init.text;
          const value =
            ts.isJsxExpression(init) && init.expression ? evalLiteralNode(init.expression, checker) : NOT_STATIC;
          return typeof value === 'string' ? value : NOT_STATIC;
        };
        const name = attr('name') ?? (kind === 'rows' ? 'row' : undefined);
        if (!name)
          throw new Error(`<ToolJet.${tag.name.getText()}> in component "${componentName}" is missing a "name".`);
        // A name only known at runtime (one slot per tab) can't be listed; the host learns it when the slot mounts.
        if (name !== NOT_STATIC) {
          const variable = kind === 'rows' ? attr('variable') : undefined;
          addSlot({ name, kind, ...(typeof variable === 'string' ? { variable } : {}) });
        }
      }
    }
    ts.forEachChild(node, slotVisitor);
  };
  ts.forEachChild(fnNode.body, slotVisitor);

  const validationClash = validation && VALIDATION_EXPOSED_NAMES.find((name) => exposedNames.has(name));
  if (validationClash) {
    throw new Error(
      `Name "${validationClash}" in component "${componentName}" is reserved by ToolJet while the component calls useValidation.`
    );
  }

  for (const { key, context } of visibleWhenKeys) {
    if (!props.some((prop) => prop.name === key)) {
      throw new Error(`${context}: visibleWhen key "${key}" is not a prop of component "${componentName}".`);
    }
  }

  return {
    displayName: toDisplayName(componentName),
    defaultWidth,
    defaultHeight,
    props,
    styles,
    events,
    actions,
    ...(validation ? { validation } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(fit !== undefined ? { fit } : {}),
    ...(loading ? { loading } : {}),
    ...(usage ? { usage } : {}),
    ...(controlState ? { controlState } : {}),
    ...(slots.length ? { slots } : {}),
    ...roleSettings,
  };
}

// Searches the whole subtree (including nested helper closures, e.g. a component
// that builds its JSX via nested renderX() functions before returning it) for any
// JSX node — used as a lightweight signal that a declaration is a React component.
function containsJsx(node: ts.Node): boolean {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return true;

  return !!ts.forEachChild(node, (child) => (containsJsx(child) ? true : undefined));
}

// React's convention: a capitalised function that calls a hook is a component, even when its JSX is drawn by the
// hook it calls (`export const DatePicker = (props) => usePicker(props, false)`).
const isPascalCase = (name: string) => /^[A-Z]/.test(name);

function callsHook(node: ts.Node): boolean {
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    const name = ts.isIdentifier(callee)
      ? callee.text
      : ts.isPropertyAccessExpression(callee)
      ? callee.name.text
      : undefined;
    if (name && /^use[A-Z]/.test(name)) return true;
  }
  return !!ts.forEachChild(node, (child) => (callsHook(child) ? true : undefined));
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

// The project's own function a call resolves to (not a library's, not a type declaration), or undefined.
function projectFunctionOf(
  callee: ts.Expression,
  checker: ts.TypeChecker
): ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | undefined {
  let symbol = checker.getSymbolAtLocation(callee);
  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const decl = symbol?.declarations?.[0];
  const file = decl?.getSourceFile();
  if (!decl || !file || file.isDeclarationFile || file.fileName.includes('/node_modules/')) return undefined;
  return getFunctionLikeNode(decl);
}

// Whether a function uses the SDK (a ToolJet.x call or <ToolJet.X>), directly or through more of the project's own
// functions.
function usesSdk(
  fn: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction,
  checker: ts.TypeChecker,
  seen: Set<ts.Node>
): boolean {
  if (seen.has(fn) || !fn.body) return false;
  seen.add(fn);
  const visit = (node: ts.Node): boolean => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'ToolJet') {
      if (isToolJetSdkIdentifier(node.expression, checker)) return true;
    }
    if (ts.isCallExpression(node)) {
      const helper = projectFunctionOf(node.expression, checker);
      if (helper && usesSdk(helper, checker, seen)) return true;
    }
    return !!ts.forEachChild(node, (child) => (visit(child) ? true : undefined));
  };
  return visit(fn.body);
}

// The project's own functions a component calls that use ToolJet hooks. Reading the component alone doesn't see the
// fields they declare; recording a render does (manifest-recorder.ts).
function sdkHelpersCalledBy(decl: ts.Declaration, checker: ts.TypeChecker): string[] {
  const fn = getFunctionLikeNode(decl);
  if (!fn?.body) return [];
  const names = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const helper = projectFunctionOf(node.expression, checker);
      if (helper && helper !== fn && usesSdk(helper, checker, new Set([fn]))) {
        names.add(node.expression.getText());
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(fn.body, visit);
  return [...names];
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

  const value = evalLiteralNode(node, checker);
  if (typeof value === 'string') return value;

  throw new Error(`${context}: "${key}" must be a string literal or a const string.`);
}

function readNumberProp(
  obj: ts.ObjectLiteralExpression,
  key: string,
  checker: ts.TypeChecker,
  context: string
): number | undefined {
  const node = getPropNode(obj, key, checker);
  if (!node) return undefined;

  const value = evalLiteralNode(node, checker);
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  throw new Error(`${context}: "${key}" must be a number.`);
}

function readVisibleWhen(
  obj: ts.ObjectLiteralExpression,
  checker: ts.TypeChecker,
  context: string
): ManifestVisibleWhen | undefined {
  const node = getPropNode(obj, 'visibleWhen', checker);
  if (!node) return undefined;

  const rule = resolveObjectLiteral(node, checker);
  const valueNode = rule && getPropNode(rule, 'value', checker);
  const key = rule && readStringProp(rule, 'key', checker, `${context}, visibleWhen`);
  if (!rule || !key || !valueNode) {
    throw new Error(`${context}: "visibleWhen" must be an object literal with a "key" and a "value".`);
  }

  const value = evalLiteralNode(valueNode, checker);
  if (value === NOT_STATIC) {
    throw new Error(`${context}: "visibleWhen" value must be a static literal.`);
  }
  return { key, value };
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

  // 'a' + 'b': text joined from parts that are all static.
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evalLiteralNode(node.left, checker);
    const right = evalLiteralNode(node.right, checker);
    if (left === NOT_STATIC || right === NOT_STATIC) return NOT_STATIC;
    if (typeof left === 'string' || typeof right === 'string') return `${left}${right}`;
    return NOT_STATIC;
  }

  // `Up to ${LIMIT}.`: a template whose every substitution is static.
  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;
    for (const span of node.templateSpans) {
      const value = evalLiteralNode(span.expression, checker);
      if (value === NOT_STATIC || (value !== null && typeof value === 'object')) return NOT_STATIC;
      text += `${value}${span.literal.text}`;
    }
    return text;
  }

  // TOKEN.brand: a property of a const object.
  if (ts.isPropertyAccessExpression(node)) {
    const target = evalLiteralNode(node.expression, checker);
    const key = node.name.getText();
    return isPlainObject(target) && Object.prototype.hasOwnProperty.call(target, key) ? target[key] : NOT_STATIC;
  }

  // Calls, other arithmetic, let bindings, parameters, ... — can't be known without running the component.
  return NOT_STATIC;
}
