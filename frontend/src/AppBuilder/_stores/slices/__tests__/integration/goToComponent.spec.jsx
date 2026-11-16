/**
 * Inspector → "Go to component". The component may sit in a tab that is not active, in a modal that
 * is closed, or on the canvas behind an open modal. Each case must end in a selection the user can
 * see, or a message saying why not — never a silent no-op or a thrown error.
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import useCallbackActions from '@/AppBuilder/LeftSidebar/LeftSidebarInspector/useCallbackActions';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp, componentDefinition } from '@/test/app-builder';

// Slot ids are "<36-char component id>-<slot>", so the ids here must be real-length.
const TABS = '11111111-1111-4111-8111-111111111111';
const MODAL = '22222222-2222-4222-8222-222222222222';
const TAB_CHILD = '33333333-3333-4333-8333-333333333333';
const MODAL_CHILD = '44444444-4444-4444-8444-444444444444';
const FOOTER_CHILD = '55555555-5555-4555-8555-555555555555';
const BUTTON = '66666666-6666-4666-8666-666666666666';

const state = () => useStore.getState();
const child = (id, name, parent) => {
  const definition = componentDefinition(id, name, 'Text');
  definition.component.parent = parent;
  return definition;
};

let setTab;

beforeEach(() => {
  setTab = jest.fn();
  seedApp({
    [TABS]: componentDefinition(TABS, 'tabs1', 'Tabs'),
    [MODAL]: componentDefinition(MODAL, 'modal1', 'ModalV2'),
    [BUTTON]: componentDefinition(BUTTON, 'button1', 'Button'),
    [TAB_CHILD]: child(TAB_CHILD, 'text4', `${TABS}-1`),
    [MODAL_CHILD]: child(MODAL_CHILD, 'text3', MODAL),
    [FOOTER_CHILD]: child(FOOTER_CHILD, 'text5', `${MODAL}-footer`),
  });
  act(() => {
    state().setExposedValue(TABS, 'currentTab', '0');
    state().setExposedValue(TABS, 'setTab', setTab);
    state().setExposedValue(MODAL, 'show', false);
  });
});

const openModal = () => act(() => state().setExposedValue(MODAL, 'show', true));

test('a child of an inactive tab: switches to its tab and targets the child itself', () => {
  const result = state().getComponentIdToAutoScroll(TAB_CHILD);

  expect(setTab).toHaveBeenCalledWith('1');
  expect(result).toEqual({ isAccessible: true, computedComponentId: TAB_CHILD });
});

test.each([
  ['body', MODAL_CHILD],
  ['footer', FOOTER_CHILD],
])('a child in the %s of a closed modal: targets the modal, which is what is on the canvas', (_slot, id) => {
  expect(state().getComponentIdToAutoScroll(id)).toEqual({ isAccessible: true, computedComponentId: MODAL });
});

test('a child of an open modal: targets the child', () => {
  openModal();

  expect(state().getComponentIdToAutoScroll(MODAL_CHILD)).toEqual({
    isAccessible: true,
    computedComponentId: MODAL_CHILD,
  });
});

test('a canvas component behind an open modal: not reachable, names the modal to close', () => {
  openModal();

  expect(state().getComponentIdToAutoScroll(BUTTON)).toEqual({
    isAccessible: false,
    computedComponentId: 'modal1',
    isOnCanvas: true,
  });
});

test('Go to component selects the target even when it is not mounted on the canvas yet', () => {
  const { result } = renderHook(() => useCallbackActions(), {
    wrapper: ({ children }) => (
      <ModuleProvider moduleId="canvas" isModuleMode={false}>
        {children}
      </ModuleProvider>
    ),
  });
  const goToComponent = result.current
    .find((group) => group.for === 'components')
    .actions.find((action) => action.name === 'Go to component').dispatchAction;

  act(() => goToComponent({ nodeName: 'text4' }));

  expect(state().selectedComponents).toEqual([TAB_CHILD]);
});
