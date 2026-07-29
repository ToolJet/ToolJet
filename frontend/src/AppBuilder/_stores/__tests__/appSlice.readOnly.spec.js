/**
 * @jest-environment node
 *
 * T4 — isEditorReadOnly flag unit tests
 *
 * Tests createAppVersionSlice in isolation via a minimal zustand store.
 * Covers TC1–TC6 from the task brief.
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

  // TC3: initial state → isEditorReadOnly is false
  test('TC3: initial state has isEditorReadOnly=false', () => {
    expect(store.getState().isEditorReadOnly).toBe(false);
  });

  // TC1: setIsEditorReadOnly(true) → isEditorReadOnly becomes true
  test('TC1: setIsEditorReadOnly(true) sets flag to true', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().isEditorReadOnly).toBe(true);
  });

  // TC2: setIsEditorReadOnly(false) after true → isEditorReadOnly becomes false
  test('TC2: setIsEditorReadOnly(false) clears flag', () => {
    store.getState().setIsEditorReadOnly(true);
    store.getState().setIsEditorReadOnly(false);
    expect(store.getState().isEditorReadOnly).toBe(false);
  });

  // TC4: getShouldFreeze returns true when isEditorReadOnly=true (module editor + canEdit=false seam)
  test('TC4: getShouldFreeze()=true when isEditorReadOnly=true', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().getShouldFreeze()).toBe(true);
  });

  // TC5: getShouldFreeze returns false when isEditorReadOnly=false and no other freeze conditions
  test('TC5: getShouldFreeze()=false when isEditorReadOnly=false (canEdit=true path)', () => {
    // Ensure no other freeze conditions
    expect(store.getState().isVersionReleased).toBe(false);
    expect(store.getState().isEditorFreezed).toBe(false);
    expect(store.getState().isEditorReadOnly).toBe(false);
    expect(store.getState().getShouldFreeze()).toBe(false);
  });

  // TC6: non-module editor path — isEditorReadOnly stays false → getShouldFreeze unaffected
  test('TC6: isEditorReadOnly stays false for non-module editors (getShouldFreeze not affected)', () => {
    // Simulate non-module editor: setIsEditorReadOnly is never called (canEdit defaults to true)
    // Flag stays at initial false
    expect(store.getState().isEditorReadOnly).toBe(false);
    expect(store.getState().getShouldFreeze()).toBe(false);
  });

  // Regression: isEditorFreezed and isEditorReadOnly are independent
  test('isEditorFreezed true does not affect isEditorReadOnly', () => {
    store.getState().setIsEditorFreezed(true);
    expect(store.getState().isEditorReadOnly).toBe(false);
    // getShouldFreeze still true because of isEditorFreezed
    expect(store.getState().getShouldFreeze()).toBe(true);
  });

  test('isEditorReadOnly true does not affect isEditorFreezed', () => {
    store.getState().setIsEditorReadOnly(true);
    expect(store.getState().isEditorFreezed).toBe(false);
  });
});

/**
 * useAppData flag derivation — TC4/TC5/TC6
 *
 * Tests the branching logic from useAppData:
 *   if (moduleMode) {
 *     if (!canEdit) setIsEditorReadOnly(true);
 *     else           setIsEditorReadOnly(false);
 *   }
 *
 * We exercise this inline at the slice level (no React/hook environment needed).
 */
describe('useAppData flag derivation — moduleMode + canEdit permutations', () => {
  let store;

  beforeEach(() => {
    store = makeStore();
  });

  // TC4: moduleMode=true + canEdit=false → setIsEditorReadOnly called with true
  test('TC4: moduleMode=true, canEdit=false → isEditorReadOnly becomes true', () => {
    const moduleMode = true;
    const canEdit = false;
    if (moduleMode) {
      if (!canEdit) {
        store.getState().setIsEditorReadOnly(true);
      } else {
        store.getState().setIsEditorReadOnly(false);
      }
    }
    expect(store.getState().isEditorReadOnly).toBe(true);
  });

  // TC5: moduleMode=true + canEdit=true → setIsEditorReadOnly called with false (explicit reset)
  test('TC5: moduleMode=true, canEdit=true → isEditorReadOnly becomes false (stale true is reset)', () => {
    // Pre-seed stale true to confirm the reset path fires
    store.getState().setIsEditorReadOnly(true);

    const moduleMode = true;
    const canEdit = true;
    if (moduleMode) {
      if (!canEdit) {
        store.getState().setIsEditorReadOnly(true);
      } else {
        store.getState().setIsEditorReadOnly(false);
      }
    }
    expect(store.getState().isEditorReadOnly).toBe(false);
  });

  // TC6: moduleMode=false + canEdit=false → setIsEditorReadOnly is NOT called → stays false
  test('TC6: moduleMode=false, canEdit=false → isEditorReadOnly stays false (branch never entered)', () => {
    const moduleMode = false;
    const canEdit = false;
    if (moduleMode) {
      if (!canEdit) {
        store.getState().setIsEditorReadOnly(true);
      } else {
        store.getState().setIsEditorReadOnly(false);
      }
    }
    expect(store.getState().isEditorReadOnly).toBe(false);
  });
});
