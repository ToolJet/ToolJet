/**
 * A disabled ModalV2 took no pointer input (an overlay covered its body, header and footer) but stayed usable by
 * keyboard: Tab still reached the components in it. Disabled, the body and the header and footer slots are now inert
 * and aria-disabled, still drawn, so focus skips them; the header's close button still closes the modal. Enabling the
 * modal gives everything back.
 *
 * Escape inside the modal: a nested overlay (a Select or PopoverMenu list) dismisses on Escape and marks the event
 * handled with preventDefault(). The modal used to look for the overlay in the DOM, which the overlay had already left,
 * so the same Escape closed the modal too (#5308). It now reads `defaultPrevented`.
 *
 * Real store, real RenderWidget, real ModalV2. Defaults come from the widget's own config.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { componentDefinition, seedApp } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'modal1';
const configDefaults = (section) =>
  Object.fromEntries(
    Object.entries(componentTypeDefinitionMap.ModalV2.definition[section]).map(([key, { value }]) => [
      key,
      binding(value),
    ])
  );

const widget = createWidgetHarness({ componentType: 'ModalV2', handle: ID, id: ID, capabilities: { dnd: true } });

// The App Builder page shell the modal portals into (see ModalV2.spec.jsx for why each wrapper is needed).
const PageWrapper = ({ children }) => (
  <div className="canvas-container page-container">
    <div className="canvas-content">
      <div className="tj-canvas-area">{children}</div>
    </div>
  </div>
);

const renderModal = (properties = {}) => {
  const definition = componentDefinition(ID, ID, 'ModalV2', { ...configDefaults('properties'), ...properties });
  definition.component.definition.styles = configDefaults('styles');
  seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode('view', MODULE_ID);
  return widget.session.render(
    <PageWrapper>
      <RenderWidget {...widgetProps(ID, 'ModalV2', { currentMode: 'view' })} />
    </PageWrapper>
  );
};

const modalBody = () => document.querySelector('[data-cy="modal-body"]');
const slot = (name) => document.querySelector(`[data-cy$="-${name}-section"] .resizable-slot`);
const takesNoInput = (el) => el?.getAttribute('inert') === '' && el?.getAttribute('aria-disabled') === 'true';
const closeButton = () => document.querySelector('[data-cy="modal-close-button"]');

const open = async () => {
  renderModal();
  await widget.act('open');
  await waitFor(() => expect(modalBody()).toBeInTheDocument());
};

describe('ModalV2 disabled', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-DIS-001] keeps focus out of the header and footer, still drawn, until enabled', async () => {
    await open();
    await widget.act('setDisableModal', true);
    await waitFor(() => expect(takesNoInput(slot('header'))).toBe(true));
    expect(takesNoInput(slot('footer'))).toBe(true);
    expect(slot('footer').style.visibility).not.toBe('hidden');

    await widget.act('setDisableModal', false);
    await waitFor(() => expect(slot('header').hasAttribute('inert')).toBe(false));
    expect(slot('footer').hasAttribute('inert')).toBe(false);
    expect(slot('footer').getAttribute('aria-disabled')).toBeNull();
  });

  test("[ModalV2-DIS-002] still closes from the header's close button while disabled", async () => {
    await open();
    await widget.act('setDisableModal', true);
    expect(closeButton().closest('[inert]')).toBeNull();
    await act(async () => fireEvent.click(closeButton()));
    await waitFor(() => expect(widget.exposed().show).toBe(false));
  });
});

describe('ModalV2 Escape', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // Stands in for a nested overlay that handles Escape first, in the capture phase, as Radix does.
  const nestedOverlayTakesEscape = (event) => event.key === 'Escape' && event.preventDefault();

  test('[ModalV2-ESC-001] an Escape a nested overlay already handled leaves the modal open', async () => {
    await open();
    document.addEventListener('keydown', nestedOverlayTakesEscape, true);
    try {
      await act(async () => fireEvent.keyDown(modalBody(), { key: 'Escape', code: 'Escape', keyCode: 27 }));
      expect(widget.exposed().show).toBe(true);
    } finally {
      document.removeEventListener('keydown', nestedOverlayTakesEscape, true);
    }
  });

  test('[ModalV2-ESC-002] a plain Escape still closes the modal', async () => {
    await open();
    await act(async () => fireEvent.keyDown(modalBody(), { key: 'Escape', code: 'Escape', keyCode: 27 }));
    await waitFor(() => expect(widget.exposed().show).toBe(false));
  });
});
