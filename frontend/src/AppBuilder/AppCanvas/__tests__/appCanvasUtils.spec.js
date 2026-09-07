// Unit spec for appCanvasUtils.computeComponentName.
//
// Why this is a UNIT spec (skill §1): this file does NOT import
// `@/AppBuilder/_stores/store`, so it lives in `__tests__/` (not `integration/`).
// computeComponentName is a pure function of its three arguments — given the same
// inputs it always returns the same name — so no store, no seedApp, no mocks (skill §2/§5).
import { computeComponentName, resolveContainerBoxPadding } from '../appCanvasUtils';
import { BOX_PADDING } from '../appCanvasConstants';

// Shape helper: computeComponentName reads currentComponents[id].component.name.
// A tiny factory keeps the arrange step readable and matches the real shape exactly.
const withNames = (...names) => Object.fromEntries(names.map((name, i) => [`id${i}`, { component: { name } }]));

describe('computeComponentName', () => {
  // The moduleName path: when a name seed is passed, it wins over the widget-type
  // lookup. This is exactly how a custom component gets named after the library
  // component ('HelloWorld') instead of the host widget type ('LibraryComponent').
  test('seeds the name from moduleName, sanitized and suffixed with 1', () => {
    // Arrange: empty page (no existing components) + a name seed
    // Act
    const name = computeComponentName('LibraryComponent', {}, 'HelloWorld');
    // Assert: lowercased, first instance => suffix 1
    expect(name).toBe('helloworld1');
  });

  // The increment logic: a second component of the same base must not collide.
  test('increments the suffix past an existing sibling', () => {
    const existing = withNames('helloworld1');
    const name = computeComponentName('LibraryComponent', existing, 'HelloWorld');
    expect(name).toBe('helloworld2');
  });

  // The widget-type path: with no moduleName, the base comes from the registered
  // widget config name. Button's registry name is 'Button' (widgets/button.js).
  test('falls back to the widget type name when no moduleName is given', () => {
    const name = computeComponentName('Button', {}, undefined);
    expect(name).toBe('button1');
  });
});

// The container-box ("Margin") spacing resolver — the ONE piece of real logic in the
// padding→margin task. Everything else was declarative widget-config. Pure fn, Layer 1.
const PADDED = `${BOX_PADDING}px`;

describe('resolveContainerBoxPadding', () => {
  // Group B/D widgets: the box toggle lives on `padding`.
  test('padding "none" removes the box spacing', () => {
    expect(resolveContainerBoxPadding({ padding: 'none' })).toBe('0px');
  });
  test('padding "default" keeps the box spacing', () => {
    expect(resolveContainerBoxPadding({ padding: 'default' })).toBe(PADDED);
  });

  // Group C widgets (chart/nav/flex/image): the box toggle lives on `margin`, while their
  // `padding` holds their own inner spacing — margin MUST win so inner padding never leaks
  // into the box decision.
  test('margin takes precedence over padding — "none" margin wins over a padding value', () => {
    expect(resolveContainerBoxPadding({ margin: 'none', padding: '50' })).toBe('0px');
  });
  test('margin takes precedence over padding — "default" margin wins over padding "none"', () => {
    expect(resolveContainerBoxPadding({ margin: 'default', padding: 'none' })).toBe(PADDED);
  });

  // Backward-compat: apps saved before the `margin` key existed have only `padding` — the
  // nullish fallback (not ||) must let a real padding value through untouched.
  test('absent margin falls through to padding', () => {
    expect(resolveContainerBoxPadding({ padding: 'none' })).toBe('0px');
  });

  // Absent everything (a widget with neither key) defaults to padded — the historical
  // behaviour for every widget that never had the toggle.
  test('neither key set defaults to padded', () => {
    expect(resolveContainerBoxPadding({})).toBe(PADDED);
    expect(resolveContainerBoxPadding(undefined)).toBe(PADDED);
  });
});
