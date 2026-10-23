/**
 * The widget harness for UI 2.0 behaviour specs: the shared createWidgetHarness, with every store write it makes on a
 * spec's behalf inside act(), and the console guard on (consoleGuard.js).
 *
 * Why act(): render() seeds the store and then mounts RenderWidget, and setEvents, setExposedValue and
 * setComponentProperty write the store directly. Once a RenderWidget is mounted it is subscribed to the store, so a
 * second render() in the same test (re-seeding with other properties) or any of those writes updates it outside act,
 * and React logs "An update to RenderWidget inside a test was not wrapped in act(...)". Inside act, React flushes
 * the update, its effects and their own store writes before the call returns, as it does for a user event.
 *
 * Specs import createWidgetHarness from here, first, and the helpers (binding, setVariableOn...) from the shared
 * harness, '@/AppBuilder/Widgets/__tests__/integration/widgetHarness', whose import also files them as integration
 * specs (scripts/validate-test-layout.js).
 */
import './consoleGuard';
import { act, waitFor } from '@testing-library/react';
import { createWidgetHarness as createSharedHarness } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// In the editor a widget inside a canvas (a List view row, a tab) gets ConfigHandle, which lazy-loads the AI chat
// tree (ConfigHandle/MentionComponentInChat), and that reaches the app's onboarding and invitation stores. Their
// helpers load the store with a top-level await, which only the bundlers handle: under jest the module logs
// "Failed to load store: ReferenceError: await is not defined" and exports undefined. These stand-ins export the same
// undefined without the error, as jest.config.js does for posthogHelper.
jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

/** Runs `fn` inside a synchronous act() and returns its result. */
const inAct =
  (fn) =>
  (...args) => {
    let result;
    act(() => {
      result = fn(...args);
    });
    return result;
  };

const WRITES = [
  'render',
  'renderInsideForm',
  'teardown',
  'setEvents',
  'setExposedValue',
  'setComponentProperty',
  'setLicenseFeatures',
];

export function createWidgetHarness(options) {
  const harness = createSharedHarness(options);
  const wrapped = {};
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(harness))) {
    Object.defineProperty(
      wrapped,
      key,
      WRITES.includes(key) ? { ...descriptor, value: inAct(descriptor.value) } : descriptor
    );
  }
  /**
   * Runs a component action the way an app does (`await components.x.action(...)`) and returns the exposed values as
   * they are right after its promise resolves, before act() flushes anything else: what the next line of a query
   * would read. `widget.act` reads them only after act has flushed every update and effect.
   */
  wrapped.actNow = async (name, ...args) => {
    await waitFor(() => expect(harness.exposed()?.[name]).toBeInstanceOf(Function));
    let seen;
    await act(async () => {
      await harness.exposed()[name](...args);
      seen = { ...harness.exposed() };
    });
    return seen;
  };
  /**
   * Runs several actions as one RunJS query does (`await a(); await b();`): all inside one act() scope, so React work
   * an action leaves for later (updates scheduled in effects) is still pending when the next one runs. Returns the
   * exposed values right after each action and once everything has settled; a late update that writes over a later
   * action shows in `settled`.
   */
  wrapped.runQuery = async (steps) => {
    await waitFor(() => expect(harness.exposed()?.[steps[0][0]]).toBeInstanceOf(Function));
    const after = [];
    await act(async () => {
      for (const [name, ...args] of steps) {
        await harness.exposed()[name](...args);
        after.push({ ...harness.exposed() });
      }
    });
    return { after, settled: { ...harness.exposed() } };
  };
  return wrapped;
}

/**
 * jsdom has no layout, so a chart's ResponsiveContainer (the one box Recharts measures) reads 0 x 0, draws nothing and
 * Recharts warns that the chart needs a size. This gives that box `width` x `height` for the spec file's tests; every
 * other element measures as jsdom does. Call it at the top level of a spec that draws charts.
 */
export function measureChartsAt(width, height) {
  let measure;
  beforeAll(() => {
    const own = Element.prototype.getBoundingClientRect;
    measure = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
      return this.classList?.contains('recharts-responsive-container')
        ? { x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, width, height }
        : own.call(this);
    });
  });
  afterAll(() => measure.mockRestore());
}
