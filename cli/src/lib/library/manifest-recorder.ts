import * as esbuild from 'esbuild';
import * as path from 'path';
import { createRequire } from 'module';

import { readRoleSettings } from './manifest-generator';
import type {
  Manifest,
  ManifestAction,
  ManifestComponent,
  ManifestEvent,
  ManifestProp,
  ManifestSlot,
  ManifestValidationKind,
} from './manifest-generator';

// The static pass only sees hook calls written directly in a component's body. Fields a component declares through
// its own helpers (a shared useFieldStyles, a loop over a list of styles) are found by rendering each component once
// with a recording SDK: every hook call it makes is recorded with its options, and fills in what the static pass missed.

interface RecordedCall {
  kind: 'prop' | 'style' | 'event' | 'action' | 'settings' | 'validation' | 'controlState' | 'slot';
  type?: ManifestProp['type'];
  options: Record<string, any>;
}

const PROP_HOOKS: Record<string, ManifestProp['type']> = {
  useStateString: 'string',
  useStateNumber: 'number',
  useStateBoolean: 'boolean',
  useStateObject: 'object',
  useStateArray: 'array',
  useStateEnumeration: 'enumeration',
};

const STYLE_HOOKS: Record<string, ManifestProp['type']> = {
  useStyleString: 'string',
  useStyleNumber: 'number',
  useStyleBoolean: 'boolean',
  useStyleEnumeration: 'enumeration',
};

// Options copied as they are onto a prop or style (enumDefinition and expose are renamed below).
const FIELD_KEYS = [
  'label',
  'description',
  'inspector',
  'section',
  'placeholder',
  'min',
  'max',
  'visibleWhen',
  'iconSet',
  'enumLabels',
] as const;

const RESERVED_EXPOSED_NAMES = new Set(['isVisible', 'isLoading', 'setVisibility', 'setLoading']);
const RESERVED_STYLE_NAMES = new Set(['boxShadow']);
const VALIDATION_KINDS = ['text', 'choice', 'date'];
const SLOT_KINDS = ['slot', 'rows', 'popup'];

// What a hook's options hold that the manifest can carry: functions (a value read at runtime) are dropped.
const toJson = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value ?? {}, (_key, v) => (typeof v === 'function' ? undefined : v)));

// Stands in for a package that can't load outside a browser (a map library touching window on import): anything read
// from it is itself, so the component still renders far enough to declare its fields.
const stub: any = new Proxy(function () {}, {
  get: (_target, key) =>
    key === 'then' || key === '__esModule' ? undefined : key === Symbol.toPrimitive ? () => '' : stub,
  apply: () => stub,
  construct: () => stub,
});

// In a "type": "module" package esbuild imports a CommonJS package Node's way (`__toESM(require(x), 1)`): its default
// export is the whole module.exports, even for a compiled ES module (__esModule). The library's real bundle resolves
// such packages the bundlers' way (default is exports.default), so the recording does too (e.g. @emotion/cache).
const withBundlerInterop = (code: string): string => code.replace(/__toESM\((require\("[^"]+"\)), 1\)/g, '__toESM($1)');

function createRecordingSdk() {
  let calls: RecordedCall[] | null = null;
  const push = (call: RecordedCall) => calls?.push(call);

  const ToolJet: Record<string, unknown> = {
    useEventCallback: (options: unknown) => {
      push({ kind: 'event', options: toJson(options) });
      return () => {};
    },
    useAction: (options: unknown) => push({ kind: 'action', options: toJson(options) }),
    useComponentSettings: (options: unknown) => push({ kind: 'settings', options: toJson(options) }),
    useValidation: (options: unknown) => {
      push({ kind: 'validation', options: toJson(options) });
      return { isValid: true, error: '', required: false, touch: () => {} };
    },
    useControlState: () => {
      push({ kind: 'controlState', options: {} });
      return { disabled: false, loading: false };
    },
    useFieldId: () => 'field',
    useFormClear: () => {},
    useRows: () => {},
    useRowResolver: () => (template: unknown) => template,
    Slot: (props: { name?: string }) => {
      push({ kind: 'slot', options: { name: props?.name, kind: 'slot' } });
      return null;
    },
    RowSlot: (props: { name?: string; variable?: string }) => {
      push({ kind: 'slot', options: { name: props?.name ?? 'row', kind: 'rows', variable: props?.variable } });
      return null;
    },
    PopupSlot: (props: { name?: string }) => {
      push({ kind: 'slot', options: { name: props?.name, kind: 'popup' } });
      return null;
    },
  };
  for (const [method, type] of Object.entries(PROP_HOOKS)) {
    ToolJet[method] = (options: { initialValue?: unknown }) => {
      push({ kind: 'prop', type, options: toJson(options) });
      return [options?.initialValue, () => {}];
    };
  }
  for (const [method, type] of Object.entries(STYLE_HOOKS)) {
    ToolJet[method] = (options: { initialValue?: unknown }) => {
      push({ kind: 'style', type, options: toJson(options) });
      return options?.initialValue;
    };
  }

  return {
    // A hook the recorder doesn't know returns nothing rather than failing the render.
    ToolJet: new Proxy(ToolJet, { get: (target, key) => (key in target ? target[key as string] : () => undefined) }),
    start: () => {
      calls = [];
    },
    stop: () => {
      const recorded = calls ?? [];
      calls = null;
      return recorded;
    },
  };
}

export async function recordManifest(projectRoot: string, manifest: Manifest, warnings: string[]): Promise<Manifest> {
  const projectRequire = createRequire(path.join(projectRoot, 'package.json'));
  let React: any;
  let renderToStaticMarkup: (element: unknown) => string;
  try {
    React = projectRequire('react');
    ({ renderToStaticMarkup } = projectRequire('react-dom/server'));
  } catch {
    warnings.push(
      "react and react-dom aren't installed, so fields declared through helper functions are missing from the manifest."
    );
    return manifest;
  }

  const sdk = createRecordingSdk();
  const sdkKey = '__tj_recording_sdk';
  (globalThis as any)[sdkKey] = sdk.ToolJet;

  let mod: Record<string, unknown>;
  try {
    const result = await esbuild.build({
      entryPoints: [path.join(projectRoot, 'src/index.ts')],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      write: false,
      packages: 'external',
      plugins: [
        {
          name: 'tooljet-sdk-recorder',
          setup(build) {
            build.onResolve({ filter: /^@tooljet\/custom-component-sdk$/ }, () => ({
              path: 'sdk',
              namespace: 'tooljet-sdk-recorder',
            }));
            build.onLoad({ filter: /.*/, namespace: 'tooljet-sdk-recorder' }, () => ({
              contents: `module.exports = { ToolJet: globalThis.${sdkKey} };`,
              loader: 'js',
            }));
          },
        },
      ],
      loader: { '.css': 'empty' },
      jsx: 'automatic',
      tsconfig: path.join(projectRoot, 'tsconfig.json'),
      logLevel: 'silent',
    });
    const safeRequire = (id: string) => {
      try {
        return projectRequire(id);
      } catch {
        return stub;
      }
    };
    const module = { exports: {} as Record<string, unknown> };
    // eslint-disable-next-line no-new-func
    new Function('module', 'exports', 'require', withBundlerInterop(result.outputFiles[0].text))(
      module,
      module.exports,
      safeRequire
    );
    mod = module.exports;
  } catch (error) {
    warnings.push(
      `Couldn't load the components to record their fields (${String((error as Error).message).split('\n')[0]}), so ` +
        'fields declared through helper functions are missing from the manifest.'
    );
    delete (globalThis as any)[sdkKey];
    return manifest;
  }

  const quietError = console.error;
  const quietWarn = console.warn;
  console.error = () => {}; // server-render warnings (useLayoutEffect) are noise here
  console.warn = () => {};
  const components: Record<string, ManifestComponent> = {};
  try {
    for (const [name, component] of Object.entries(manifest.components)) {
      const Component = mod[name];
      if (!Component) {
        components[name] = component;
        continue;
      }
      sdk.start();
      try {
        renderToStaticMarkup(React.createElement(Component));
      } catch (error) {
        warnings.push(
          `Component "${name}" threw while rendering with its defaults (${
            String((error as Error).message).split('\n')[0]
          }): ` + 'fields it declares after that point through helper functions are missing from the manifest.'
        );
      }
      components[name] = mergeRecorded(name, component, sdk.stop());
    }
  } finally {
    console.error = quietError;
    console.warn = quietWarn;
    delete (globalThis as any)[sdkKey];
  }
  // A default or display text the static pass couldn't read is no longer lost once the render recorded it.
  const notStatic =
    /^(Prop|Style) "(.+)" in component "(.+)": (initialValue|label|description|placeholder) isn't a static/;
  const kept = warnings.filter((warning) => {
    const match = notStatic.exec(warning);
    if (!match) return true;
    const [, kind, field, componentName, option] = match;
    const fields = kind === 'Style' ? components[componentName]?.styles : components[componentName]?.props;
    const key = option === 'initialValue' ? 'default' : option;
    return (fields?.find((entry) => entry.name === field) as Record<string, unknown> | undefined)?.[key] === undefined;
  });
  warnings.splice(0, warnings.length, ...kept);
  return { ...manifest, components };
}

function toField(call: RecordedCall): ManifestProp {
  const { options } = call;
  const field: ManifestProp = { name: options.name, type: call.type as ManifestProp['type'] };
  if (options.initialValue !== undefined) field.default = options.initialValue;
  for (const key of FIELD_KEYS) if (options[key] !== undefined) (field as any)[key] = options[key];
  if (options.enumDefinition) field.enumValues = options.enumDefinition;
  if (call.kind === 'style' && options.expose === true) field.exposed = true;
  return field;
}

function toAction({ options }: RecordedCall): ManifestAction {
  const params = Array.isArray(options.params)
    ? options.params.map((param: Record<string, any>) => {
        const { handle, displayName, defaultValue, type, options: paramOptions } = param;
        return {
          handle,
          ...(displayName ? { displayName } : {}),
          ...('defaultValue' in param ? { defaultValue } : {}),
          ...(type ? { type } : {}),
          ...(paramOptions ? { options: paramOptions } : {}),
        };
      })
    : undefined;
  return {
    name: options.name,
    ...(options.displayName ? { displayName: options.displayName } : {}),
    ...(params?.length ? { params } : {}),
  };
}

// Recorded entries come in render order and carry the evaluated options; one the static pass found that didn't run
// (a hook behind a condition) keeps its place after them.
function mergeByName<T extends { name: string }>(found: T[], recorded: T[]): T[] {
  const byName = new Map(found.map((entry) => [entry.name, entry]));
  const merged = recorded.map((entry) => ({ ...byName.get(entry.name), ...entry }));
  const recordedNames = new Set(recorded.map((entry) => entry.name));
  return [...merged, ...found.filter((entry) => !recordedNames.has(entry.name))];
}

function mergeRecorded(componentName: string, found: ManifestComponent, calls: RecordedCall[]): ManifestComponent {
  // A component may render twice in one pass, so the first call of each kind and name is the declaration.
  const seen = new Set<string>();
  const unique = calls.filter((call) => {
    if (!['prop', 'style', 'event', 'action', 'slot'].includes(call.kind)) return true;
    if (typeof call.options.name !== 'string' || !call.options.name) return false;
    const key = `${call.kind}:${call.options.kind ?? ''}:${call.options.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const of = (kind: RecordedCall['kind']) => unique.filter((call) => call.kind === kind);

  const settings = of('settings')[0]?.options ?? {};
  const validationCall = of('validation')[0];
  const validationKind = validationCall ? validationCall.options.kind ?? 'text' : undefined;
  if (validationKind !== undefined && !VALIDATION_KINDS.includes(validationKind)) {
    throw new Error(
      `ToolJet.useValidation in component "${componentName}": "kind" must be 'text', 'choice' or 'date'.`
    );
  }

  const slots = [...(found.slots ?? [])];
  const addSlot = (slot: ManifestSlot) => {
    if (!slots.some((s) => s.name === slot.name && s.kind === slot.kind)) slots.push(slot);
  };
  [...(Array.isArray(settings.slots) ? settings.slots : []), ...of('slot').map((call) => call.options)]
    .filter((slot) => typeof slot?.name === 'string' && SLOT_KINDS.includes(slot.kind))
    .forEach(({ name, kind, variable }) =>
      addSlot({ name, kind, ...(typeof variable === 'string' ? { variable } : {}) })
    );

  const component: ManifestComponent = {
    ...found,
    props: mergeByName(found.props, of('prop').map(toField)),
    styles: mergeByName(found.styles, of('style').map(toField)),
    events: mergeByName<ManifestEvent>(
      found.events,
      of('event').map(({ options }) => ({
        name: options.name,
        ...(options.displayName ? { displayName: options.displayName } : {}),
      }))
    ),
    actions: mergeByName(found.actions, of('action').map(toAction)),
  };
  if (Number.isInteger(settings.defaultWidth) && settings.defaultWidth > 0)
    component.defaultWidth = settings.defaultWidth;
  if (Number.isInteger(settings.defaultHeight) && settings.defaultHeight > 0)
    component.defaultHeight = settings.defaultHeight;
  if (component.role === undefined && typeof settings.role === 'string') component.role = settings.role;
  if (component.fit === undefined && typeof settings.fit === 'boolean') component.fit = settings.fit;
  if (component.loading === undefined && settings.loading === 'own') component.loading = 'own';
  if (component.usage === undefined && typeof settings.usage === 'string') component.usage = settings.usage;
  if (component.validation === undefined && validationKind)
    component.validation = validationKind as ManifestValidationKind;
  const hasRoleSettings = ['roleProps', 'roleValues', 'roleEvents', 'roleActions', 'labelCase'].some(
    (key) => key in found
  );
  if (!hasRoleSettings) Object.assign(component, readRoleSettings(settings, componentName));
  if (of('controlState').length) component.controlState = true;
  if (slots.length) component.slots = slots;

  checkNames(componentName, component);
  return component;
}

// The rules the static pass enforces on the calls it sees, applied to the merged result.
function checkNames(componentName: string, component: ManifestComponent) {
  const exposed = new Map<string, string>();
  const claim = (name: string, kind: string) => {
    if (RESERVED_EXPOSED_NAMES.has(name)) {
      throw new Error(`Name "${name}" in component "${componentName}" is reserved by ToolJet.`);
    }
    const owner = exposed.get(name);
    if (owner) {
      throw new Error(`Name "${name}" in component "${componentName}" is used by both a ${owner} and a ${kind}.`);
    }
    exposed.set(name, kind);
  };
  component.props.forEach((prop) => claim(prop.name, 'prop'));
  component.actions.forEach((action) => claim(action.name, 'action'));
  component.styles.forEach((style) => {
    if (RESERVED_STYLE_NAMES.has(style.name)) {
      throw new Error(`Style name "${style.name}" in component "${componentName}" is reserved by ToolJet.`);
    }
    if (style.exposed) claim(style.name, 'exposed style');
  });
  if (component.validation) {
    const clash = ['isValid', 'isMandatory'].find((name) => exposed.has(name));
    if (clash) {
      throw new Error(
        `Name "${clash}" in component "${componentName}" is reserved by ToolJet while the component calls useValidation.`
      );
    }
  }
  for (const field of [...component.props, ...component.styles]) {
    if (field.visibleWhen && !component.props.some((prop) => prop.name === field.visibleWhen?.key)) {
      throw new Error(
        `${field.name} in component "${componentName}": visibleWhen key "${field.visibleWhen.key}" is not a prop.`
      );
    }
  }
}
