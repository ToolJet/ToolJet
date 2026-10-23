// Local stand-in for ToolJet: hosts each library component the way the inline runtime does
// (shadow root, .tj-cc-root body, body-level popup layer, one shared module, transformed widget wrapper) and implements the
// ToolJet SDK hooks against a tiny in-page store instead of the app's exposed variables.
import * as React from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

const h = React.createElement;

// Same baseline as the runtime's InlineLibraryComponent.
const BASE_CSS = `
:host { display: block; position: relative; }
.tj-cc-root { width: 100%; height: 100%; overflow: hidden; }
*, *::before, *::after { box-sizing: border-box; }
`;

const COLUMN_PX = 30; // ~ a 1290px canvas / 43 grid columns
const ROW_PX = 10; // ToolJet GRID_HEIGHT

// The ten components on the demo canvas, with the instance names ToolJet would give them.
const DEMO = [
  ['input1', 'Input'],
  ['select1', 'Select'],
  ['toggleGroup1', 'ToggleGroup'],
  ['slider1', 'Slider'],
  ['switch1', 'Switch'],
  ['button1', 'Button'],
  ['dialog1', 'Dialog'],
  ['dropdownMenu1', 'DropdownMenu'],
  ['stat1', 'Stat'],
  ['alert1', 'Alert'],
];

// ?all also shows the other ten.
if (new URLSearchParams(location.search).has('all')) {
  DEMO.push(
    ['textarea1', 'Textarea'],
    ['checkbox1', 'Checkbox'],
    ['radioGroup1', 'RadioGroup'],
    ['otpInput1', 'OtpInput'],
    ['badge1', 'Badge'],
    ['avatar1', 'Avatar'],
    ['progress1', 'Progress'],
    ['skeleton1', 'Skeleton'],
    ['tabs1', 'Tabs'],
    ['accordion1', 'Accordion']
  );
}

// ---- tiny store for exposed values + events ----
const exposed = {};
const events = [];
const render = () => {
  document.getElementById('state').textContent = JSON.stringify(exposed, null, 2);
  document.getElementById('events').textContent = events.slice(-40).reverse().join('\n') || '(none yet)';
};

const Instance = React.createContext(null);
const useInstance = () => {
  const instance = React.useContext(Instance);
  if (!instance) throw new Error('ToolJet hook called outside a component');
  return instance;
};

const makeStateHook = () =>
  function useTjState({ name, initialValue }) {
    const instance = useInstance();
    const [value, setValue] = React.useState(initialValue);
    const ref = React.useRef(value);
    React.useEffect(() => instance.expose(name, ref.current), [value]);
    const set = React.useCallback(
      (next) => {
        ref.current = next;
        instance.expose(name, next);
        setValue(next);
      },
      [instance, name]
    );
    return [value, set];
  };

window.__tj_ToolJet = {
  useStateString: makeStateHook(),
  useStateNumber: makeStateHook(),
  useStateBoolean: makeStateHook(),
  useStateObject: makeStateHook(),
  useStateArray: makeStateHook(),
  useStateEnumeration: makeStateHook(),
  useEventCallback({ name }) {
    const instance = useInstance();
    return React.useCallback(() => instance.fire(name), [instance, name]);
  },
  useAction({ name }, handler) {
    const instance = useInstance();
    const ref = React.useRef(handler);
    ref.current = handler;
    React.useEffect(() => {
      instance.actions[name] = (...args) => ref.current(...args);
      return () => delete instance.actions[name];
    }, [instance, name]);
  },
  // Styles: the harness has no Inspector, so a style is its initialValue.
  useStyleString: ({ initialValue }) => initialValue,
  useStyleNumber: ({ initialValue }) => initialValue,
  useStyleBoolean: ({ initialValue }) => initialValue,
  useStyleEnumeration: ({ initialValue }) => initialValue,
  // Slots: ToolJet renders a drop area here; the harness shows a placeholder.
  Slot: ({ name, className, style }) =>
    h('div', { className, style: { border: '1px dashed #b4bcc6', borderRadius: 6, minHeight: 40, ...style }, 'data-tj-slot': name }),
  useComponentSettings() {},
};

// ?every renders every component in the manifest, each behind an error boundary.
const renderErrors = (window.__renderErrors = []);
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    renderErrors.push(`${this.props.name}: ${error?.message ?? error}`);
  }
  render() {
    return this.state.error ? h('pre', { style: { color: '#d72d39', fontSize: 11 } }, String(this.state.error?.message ?? this.state.error)) : this.props.children;
  }
}

const makeInstance = (name) => ({
  actions: {},
  expose(key, value) {
    (exposed[name] ??= {})[key] = value;
    render();
  },
  fire(event) {
    const snapshot = JSON.stringify(exposed[name] ?? {});
    events.push(`${new Date().toLocaleTimeString()}  ${name}.${event}  ${snapshot.slice(0, 90)}`);
    render();
  },
});

// Example arguments for actions that take parameters.
const ACTION_ARGS = {
  'input1.setValue': ['hello@tooljet.com'],
  'select1.setValue': ['grapes'],
  'toggleGroup1.setValue': ['year'],
  'slider1.setValue': ['80'],
  'switch1.setChecked': ['true'],
  'textarea1.setValue': ['Set from an action'],
  'checkbox1.setChecked': ['true'],
  'radioGroup1.setValue': ['mentions'],
  'otpInput1.setValue': ['424242'],
  'tabs1.setTab': ['analytics'],
  'accordion1.open': ['item-2'],
  'progress1.setValue': ['90'],
};

const [lib, manifest, css] = await Promise.all([
  import('../dist/index.js'),
  fetch('../dist/manifest.json').then((r) => r.json()),
  fetch('../dist/index.css').then((r) => r.text()),
]);

if (new URLSearchParams(location.search).has('every')) {
  DEMO.length = 0;
  for (const name of Object.keys(manifest.components)) DEMO.push([`${name[0].toLowerCase()}${name.slice(1)}1`, name]);
}

const canvas = document.getElementById('canvas');
const portals = [];

for (const [name, componentName] of DEMO) {
  const config = manifest.components[componentName];
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `<div class="item-name">${name} <span>· ${componentName} · ${config.defaultWidth}×${config.defaultHeight}</span></div>`;
  const host = document.createElement('div');
  host.className = 'widget';
  host.dataset.cy = name;
  host.style.width = `${config.defaultWidth * COLUMN_PX}px`;
  host.style.height = `${config.defaultHeight * ROW_PX}px`;
  const root = host.attachShadow({ mode: 'open' });
  const base = document.createElement('style');
  base.textContent = BASE_CSS;
  const style = document.createElement('style');
  style.textContent = css;
  const mount = document.createElement('div');
  mount.className = 'tj-cc-root';
  root.append(base, style, mount);
  // Same popup layer as the runtime: a body-level shadow root with the bundle CSS, exposed as tjOverlay.
  const popupHost = document.createElement('div');
  const popupRoot = popupHost.attachShadow({ mode: 'open' });
  const popupBase = document.createElement('style');
  popupBase.textContent = BASE_CSS;
  const popupStyle = document.createElement('style');
  popupStyle.textContent = css;
  const overlay = document.createElement('div');
  overlay.className = 'tj-cc-overlay';
  popupRoot.append(popupBase, popupStyle, overlay);
  document.body.append(popupHost);
  Object.defineProperty(root, 'tjOverlay', { value: overlay });

  const instance = makeInstance(name);
  const actionBar = document.createElement('div');
  actionBar.className = 'actions';
  for (const action of config.actions) {
    const button = document.createElement('button');
    const args = ACTION_ARGS[`${name}.${action.name}`] ?? [];
    button.textContent = `${action.name}(${args.map((a) => JSON.stringify(a)).join(', ')})`;
    button.onclick = () => instance.actions[action.name]?.(...args);
    actionBar.append(button);
  }

  // ToolJet's WidgetWrapper positions every widget with a transform (WidgetWrapper.jsx), which makes
  // the wrapper the containing block for position:fixed popups inside it. Reproduce that here.
  const widgetWrapper = document.createElement('div');
  widgetWrapper.style.transform = 'translate(0px, 0px)';
  widgetWrapper.append(host);
  wrapper.append(widgetWrapper, actionBar);
  canvas.append(wrapper);
  portals.push(createPortal(h(Instance.Provider, { value: instance }, h(Boundary, { name: componentName }, h(lib[componentName]))), mount, name));
}

createRoot(document.createElement('div')).render(h(React.Fragment, null, ...portals));
render();
window.__harnessReady = true;
