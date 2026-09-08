/**
 * @jest-environment node
 *
 * `isEditorReadOnly` — appVersionSlice
 *
 * Exercises createAppVersionSlice in isolation via a minimal zustand store, so
 * no React and no composed store are involved.
 *
 * The flag exists for the module editor: when a user opens a module they cannot
 * edit, the editor is frozen without being marked as a released version. So the
 * behaviour that matters is how it combines with the OTHER freeze reasons in
 * getShouldFreeze — that is what the last two tests pin down.
 */

const { createStore } = require('zustand/vanilla');
const { immer } = require('zustand/middleware/immer');
const { createAppVersionSlice } = require('@/AppBuilder/_stores/slices/appVersionSlice');

const makeStore = () =>
  createStore(
    immer((...args) => ({
      ...createAppVersionSlice(...args),
    }))
  );

describe('isEditorReadOnly flag — appVersionSlice', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
  });

  test('defaults to false, so a fresh editor is never read-only by accident', () => {
    expect(store.getState().isEditorReadOnly).toBe(false);
  });

  test('setIsEditorReadOnly(true) sets the flag', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().isEditorReadOnly).toBe(true);
  });

  test('setIsEditorReadOnly(false) clears a previously set flag', () => {
    store.getState().setIsEditorReadOnly(true);
    store.getState().setIsEditorReadOnly(false);
    expect(store.getState().isEditorReadOnly).toBe(false);
  });

  test('the editor freezes while the flag is set', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().getShouldFreeze()).toBe(true);
  });

  test('the editor does not freeze when the flag is clear and nothing else freezes it', () => {
    // Asserted explicitly, because getShouldFreeze ORs several reasons together
    // and a false pass here would otherwise be indistinguishable from one of the
    // others happening to be false.
    expect(store.getState().isVersionReleased).toBe(false);
    expect(store.getState().isEditorFreezed).toBe(false);
    expect(store.getState().isEditorReadOnly).toBe(false);
    expect(store.getState().getShouldFreeze()).toBe(false);
  });

  test('isEditorFreezed freezes the editor without touching the read-only flag', () => {
    // The two reasons must stay independent: a frozen (released) version and a
    // read-only module are different states, and code that reads one must not
    // see the other.
    store.getState().setIsEditorFreezed(true);
    expect(store.getState().isEditorReadOnly).toBe(false);
    expect(store.getState().getShouldFreeze()).toBe(true);
  });

  test('the read-only flag does not imply isEditorFreezed', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().isEditorFreezed).toBe(false);
  });
});

/*
 * REMOVED: a second describe block, "useAppData flag derivation — moduleMode +
 * canEdit permutations".
 *
 * It copied useAppData's `if (moduleMode) { if (!canEdit) ... }` branch into the
 * test body and then asserted on the copy. Nothing in production was executed,
 * so all three tests would still have passed if useAppData had been deleted
 * outright — they tested the test.
 *
 * Covering that derivation for real means driving useAppData itself, which needs
 * the React hook environment. Worth doing separately; a placeholder that looks
 * like coverage is worse than an acknowledged gap.
 */
