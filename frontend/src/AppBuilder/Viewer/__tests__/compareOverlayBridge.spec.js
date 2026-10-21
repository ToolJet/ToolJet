import { createCompareOverlayHandler, resolveCompareOverlay } from '../useCompareOverlayBridge';
import { isCompareMuted } from '@/AppBuilder/_utils/compareFrame';

jest.mock('@/AppBuilder/_stores/store', () => ({ __esModule: true, default: { getState: () => ({}) } }));

// The page as the viewer's store keeps it: component definitions by id, parents by id ("<id>-footer" for a slot).
const DIALOG = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const components = {
  [DIALOG]: { component: { name: 'lotHistory', component: 'ModalV2', parent: null } },
  a: { component: { name: 'historyTable', component: 'Table', parent: DIALOG } },
  b: { component: { name: 'closeButton', component: 'Button', parent: `${DIALOG}-footer` } },
  c: { component: { name: 'pageTitle', component: 'Text', parent: null } },
  [OTHER]: { component: { name: 'legacyModal', component: 'Modal', parent: null } },
  d: { component: { name: 'legacyText', component: 'Text', parent: OTHER } },
};

describe('which dialog a compare frame opens', () => {
  it('walks up from the changed component to the dialog it sits in, slots included', () => {
    expect(resolveCompareOverlay(components, ['historyTable'])).toEqual({
      status: 'found',
      id: DIALOG,
      name: 'lotHistory',
    });
    expect(resolveCompareOverlay(components, ['closeButton'])).toMatchObject({ id: DIALOG });
    expect(resolveCompareOverlay(components, ['lotHistory'])).toMatchObject({ id: DIALOG });
  });

  it("falls back to the component's parent when the component is not in this version", () => {
    expect(resolveCompareOverlay(components, ['newChart', 'lotHistory'])).toMatchObject({ id: DIALOG });
  });

  it('says when the component is on the page but not in a dialog, and when none of the names is here', () => {
    expect(resolveCompareOverlay(components, ['pageTitle'])).toEqual({ status: 'none' });
    expect(resolveCompareOverlay(components, ['gone', 'alsoGone'])).toEqual({ status: 'missing' });
    expect(resolveCompareOverlay(undefined, ['x'])).toEqual({ status: 'missing' });
  });
});

describe('opening it', () => {
  const setup = () => {
    const actions = {
      [DIALOG]: { open: jest.fn(), close: jest.fn() },
      [OTHER]: {},
    };
    const getState = () => ({
      getCurrentPageComponents: () => components,
      getExposedValueOfComponent: (id) => actions[id],
    });
    return { actions, handle: createCompareOverlayHandler(getState) };
  };

  it('opens the dialog with its own open action, its events muted first', () => {
    const { actions, handle } = setup();
    expect(handle(['historyTable'])).toEqual({ status: 'opened', name: 'lotHistory' });
    expect(actions[DIALOG].open).toHaveBeenCalledTimes(1);
    expect(isCompareMuted(DIALOG)).toBe(true);
    // Another change in the same dialog leaves it open.
    expect(handle(['closeButton'])).toEqual({ status: 'opened', name: 'lotHistory' });
    expect(actions[DIALOG].open).toHaveBeenCalledTimes(1);
    expect(actions[DIALOG].close).not.toHaveBeenCalled();
  });

  it('closes it when the selection leaves the dialog, or is cleared', () => {
    const { actions, handle } = setup();
    handle(['historyTable']);
    expect(handle(['pageTitle'])).toEqual({ status: 'none' });
    expect(actions[DIALOG].close).toHaveBeenCalledTimes(1);
    handle(['historyTable']);
    expect(handle(null)).toEqual({ status: 'none' });
    expect(actions[DIALOG].close).toHaveBeenCalledTimes(2);
  });

  it('reports a dialog it cannot open', () => {
    const { handle } = setup();
    expect(handle(['legacyText'])).toEqual({ status: 'unsupported', name: 'legacyModal' });
  });
});
