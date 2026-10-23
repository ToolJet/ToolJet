/**
 * UI 2.0 specs fail on any console.error or console.warn they did not expect: a React key or act() warning, a
 * Recharts size warning, an unhandled request. Installed by importing ui2Harness.js (which every UI 2.0 behaviour
 * spec imports first, so the guard is in place before RenderWidget's imports load) or this file directly.
 *
 * An unexpected message is still printed, with its stack, and the test it was logged in (or the next one to finish,
 * for a message logged between tests) fails with the list. The only messages let through are logged by native code
 * the UI 2.0 widgets reach (RenderWidget, the canvas, ModalV2), matched exactly on their first line, each with its
 * source. They are not UI 2.0's to fix; when the native code is fixed, delete its entry.
 */
import { format } from 'util';

const NATIVE_MESSAGES = new Set([
  // src/AppBuilder/Widgets/Date/DatepickerInput.jsx: forwardRef render function with one parameter, logged when
  // RenderWidget's imports load (editorHelpers.js imports DatetimePickerV2).
  'Warning: forwardRef render functions accept exactly two parameters: props and ref. Did you forget to use the ref parameter?',
  // src/AppBuilder/AppCanvas/RenderWidget.jsx: useStore(selector, shallow) on the core store, which is made with
  // zustand's `create` (src/AppBuilder/_stores/store.js); zustand logs this once, for the first such call.
  "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937",
  // src/AppBuilder/AppCanvas/Container.jsx: the canvas div carries `data-parentId={id}` (camel case), reached by
  // every UI 2.0 widget that holds a canvas (Tabs, List view, Kanban cards, Dialog).
  'Warning: React does not recognize the `data-parentId` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `data-parentid` instead. If you accidentally passed it from a parent component, remove it from the DOM element.',
  // src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx: ModalWidget spreads all its props, `modalProps` included,
  // onto react-bootstrap's Modal, which passes it to the dialog div. The UI 2.0 Dialog is ModalV2 itself (Ui2/Dialog);
  // ModalV2's own spec logs the same.
  'Warning: React does not recognize the `modalProps` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `modalprops` instead. If you accidentally passed it from a parent component, remove it from the DOM element.',
  // src/AppBuilder/AppCanvas/Container.jsx sets the `overflow` shorthand on the canvas over the `overflowY` that
  // src/AppBuilder/Widgets/ModalV2/Components/Modal.jsx passes in its styles; React logs it when a disabled modal's
  // overflowY changes. ModalV2's own spec logs the same.
  "Warning: Updating a style property during rerender (overflowY) when a conflicting property is set (overflow) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.",
]);

const firstLine = (args) => format(...args).split('\n')[0];

const unexpected = [];

for (const level of ['error', 'warn']) {
  const original = console[level];
  console[level] = (...args) => {
    if (NATIVE_MESSAGES.has(firstLine(args))) return;
    unexpected.push(`console.${level}: ${firstLine(args)}`);
    original.apply(console, args);
  };
}

const check = () => {
  if (!unexpected.length) return;
  const messages = unexpected.splice(0);
  throw new Error(
    `UI 2.0 specs log no console errors or warnings; this test logged ${messages.length}:\n` +
      messages.map((m) => `  - ${m}`).join('\n') +
      '\nFix the cause (see Ui2/__tests__/consoleGuard.js for the only native messages let through).'
  );
};

afterEach(check);
afterAll(check);
