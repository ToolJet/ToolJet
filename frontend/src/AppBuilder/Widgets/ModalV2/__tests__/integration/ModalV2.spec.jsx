/**
 * ModalV2: the widget's approved contract
 * (frontend/ee/test/app-builder/widgets/ModalV2/TESTING.md).
 *
 * Real store, real RenderWidget, real ModalV2 / Components/Modal / Header / Footer.
 * Nothing about the widget is mocked. `capabilities.dnd` is required — an open
 * modal mounts a real `SubContainer`, which throws `Expected drag drop context`
 * without the real react-dnd provider.
 *
 * `renderModal()` wraps the widget in `<div class="canvas-content"><div
 * class="tj-canvas-area">`, standing in for the App Builder page chrome.
 * Without it, `document.getElementsByClassName('tj-canvas-area')` /
 * `('real-canvas')` (Components/Modal.jsx's `container` prop, Modal.jsx's own
 * `getModalHostEl`) find nothing on the FIRST render (before the modal's own
 * inner `SubContainer`/`Container` has mounted its `.real-canvas` canvas div),
 * so `container` resolves to `undefined` → `document.body`. Once the modal's
 * OWN body canvas commits (also carrying class `real-canvas` —
 * `AppCanvas/Container.jsx:302`), `@restart/ui`'s `useWaitForDOMRef` re-resolves
 * the container ref, now finds the modal's own inner canvas div, and re-portals
 * the whole modal into a node that only exists because the modal is open — a
 * self-referential portal that silently never renders. The wrapper divs give
 * the container lookup an outer canvas to find instead, matching what the real
 * app builder page always provides.
 *
 * Test titles carry their approved scenario ID as a `[ModalV2-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { waitFor, fireEvent as rtlFireEvent, act, screen } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { getModalBodyHeight } from '@/AppBuilder/Widgets/ModalV2/helpers/utils';
import { onShowSideEffects } from '@/AppBuilder/Widgets/ModalV2/helpers/sideEffects';
import { componentDefinition, seedApp, binding as rawBinding } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  widgetProps,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Confirmed via explicit per-step waitFor timeouts (openModal()) that the
// portal/render itself isn't stuck — each step completes, RTL never throws
// its own "unable to find X" error. The suite is just genuinely, sometimes
// severely slower under real CI load than locally (v8 coverageProvider and
// --workerIdleMemoryLimit on test:ci did not resolve it), so this budget
// gives real, completing work room to finish instead of chasing removed
// overhead down to fit under a smaller ceiling.
const MOUNT_MS = 60000;
jest.setTimeout(MOUNT_MS);

const ID = 'modal1';
const NAME = 'modal1';

// Baseline is `modalV2.js`'s own `definition.properties`/`definition.styles`,
// copied verbatim — not invented defaults.
const DEFAULT_PROPERTIES = {
  loadingState: binding('{{false}}'),
  dynamicHeight: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledTrigger: binding('{{false}}'),
  disabledModal: binding('{{false}}'),
  useDefaultButton: binding('{{true}}'),
  triggerButtonLabel: binding('Launch Modal'),
  size: binding('lg'),
  showHeader: binding('{{true}}'),
  showFooter: binding('{{true}}'),
  hideCloseButton: binding('{{false}}'),
  hideOnEsc: binding('{{true}}'),
  closeOnClickingOutside: binding('{{false}}'),
  modalHeight: binding('{{400}}'),
  headerHeight: { value: 80 },
  footerHeight: { value: 80 },
  tooltipFormat: binding('plainText'),
  tooltip: binding(''),
};

const DEFAULT_STYLES = {
  icon: { value: 'IconAlignBoxBottomLeft' },
  iconVisibility: { value: false },
  iconColor: { value: 'var(--cc-surface1-surface)' },
  direction: { value: 'left' },
  headerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
  footerBackgroundColor: { value: 'var(--cc-surface1-surface)' },
  bodyBackgroundColor: { value: 'var(--cc-surface1-surface)' },
  triggerButtonBackgroundColor: { value: 'var(--cc-primary-brand)' },
  triggerButtonHoverBackgroundMode: { value: 'auto' },
  triggerButtonHoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
  triggerButtonTextColor: { value: 'var(--cc-surface1-surface)' },
  triggerButtonTextSize: { value: '{{14}}' },
  triggerButtonFontWeight: { value: 'normal' },
  triggerButtonContentAlignment: { value: 'center' },
  headerDividerColor: { value: 'var(--cc-default-border)' },
  footerDividerColor: { value: 'var(--cc-default-border)' },
};

const widget = createWidgetHarness({
  componentType: 'ModalV2',
  handle: NAME,
  id: ID,
  defaultProperties: DEFAULT_PROPERTIES,
  defaultStyles: DEFAULT_STYLES,
  capabilities: { dnd: true },
});

/**
 * Stand-in for the App Builder page shell (AppCanvas.jsx): `.canvas-container.page-container`
 * (outer chrome) > `.canvas-content` (scroll container) > `.tj-canvas-area` (the modal's
 * `container` prop target). Without the outer two, `useResizeSideEffects.js`'s
 * `document.querySelector('.page-container.canvas-container')` — real in every
 * production page, mounted well before any widget — returns null, and a
 * fullscreen modal crashes on `canvasElement.offsetWidth` at mount.
 * See file header for why the innermost wrapper is separately mandatory.
 */
function PageWrapper({ children }) {
  return (
    <div className="canvas-container page-container">
      <div className="canvas-content">
        <div className="tj-canvas-area">{children}</div>
      </div>
    </div>
  );
}

function renderModal({ properties = {}, styles = {}, events = [], componentId = ID, darkMode = false } = {}) {
  const definition = componentDefinition(componentId, NAME, 'ModalV2', { ...DEFAULT_PROPERTIES, ...properties });
  definition.component.definition.styles = { ...DEFAULT_STYLES, ...styles };
  seedApp({ [componentId]: definition }, { moduleId: MODULE_ID });
  store().setEditorLoading(false, MODULE_ID);
  store().setCurrentMode('edit', MODULE_ID);
  if (events.length) store().eventsSlice.setEvents(events, MODULE_ID);
  return widget.session.render(
    <PageWrapper>
      <RenderWidget {...widgetProps(componentId, 'ModalV2', { darkMode })} />
    </PageWrapper>
  );
}

const triggerButton = () => document.querySelector(`[data-cy="${NAME}-launch-button"]`);
const closeButton = () => document.querySelector('[data-cy="modal-close-button"]');
const modalBody = () => document.querySelector('[data-cy="modal-body"]');
const exposed = (key = 'show') => widget.exposed()?.[key];

const ON_OPEN_CAPTURE = setVariableOn(ID, 'onOpen');
const ON_CLOSE_CAPTURE = setVariableOn(ID, 'onClose');
const handlerSaw = () => store().getVariable('seen', MODULE_ID);

// Explicit (rather than the silent 1000ms) timeouts: on a genuine stuck
// render, this reports RTL's own "unable to find X" + DOM snapshot at the
// step that actually failed, instead of the test's outer 20000ms budget
// expiring with no indication of which step never resolved.
async function openModal() {
  await waitFor(() => expect(triggerButton()).toBeInTheDocument(), { timeout: 5000 });
  rtlFireEvent.click(triggerButton()); // already imported
  await waitFor(() => expect(modalBody()).toBeInTheDocument(), { timeout: 5000 });
}

describe('ModalV2: default rendering', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-DEF-001] the default trigger button renders with the configured label', async () => {
    renderModal();

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton()).toHaveTextContent('Launch Modal');
  });

  test('[ModalV2-DEF-002] the modal itself is closed on mount; only the trigger is visible', async () => {
    renderModal();

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(modalBody()).not.toBeInTheDocument();
    expect(exposed()).toBe(false);
  });

  test('[ModalV2-DEF-003] useDefaultButton: false removes the trigger button entirely, independent of visibility', async () => {
    // Break this catches: ModalV2.jsx rendering the button whenever `isVisible`
    // is true regardless of `useDefaultButton`.
    renderModal({ properties: { useDefaultButton: binding('{{false}}'), visibility: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isVisible')).toBe(true));
    expect(triggerButton()).not.toBeInTheDocument();
  });
});

describe('ModalV2: open/close lifecycle', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-OPEN-001] clicking the trigger button opens the modal', async () => {
    renderModal();

    await openModal();

    expect(exposed()).toBe(true);
  });

  test('[ModalV2-OPEN-002] clicking the header close button closes the modal', async () => {
    renderModal();
    await openModal();
    await waitFor(() => expect(closeButton()).toBeInTheDocument());

    await widget.session.user.click(closeButton());

    // The dialog unmounts only after react-bootstrap's Fade exit transition
    // (default 300ms), which runs on real timers even in jsdom — give it its
    // own generous wait rather than assuming it's done by the time the
    // (near-instant) store-level `show` flip is observed.
    await waitFor(() => expect(exposed()).toBe(false));
    await waitFor(() => expect(modalBody()).not.toBeInTheDocument(), { timeout: 3000 });
  });

  test('[ModalV2-OPEN-003] components.modal1.open() opens the modal programmatically', async () => {
    renderModal();
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());

    await widget.act('open');

    await waitFor(() => expect(modalBody()).toBeInTheDocument());
    expect(exposed()).toBe(true);
  });

  test('[ModalV2-OPEN-004] components.modal1.close() closes the modal programmatically', async () => {
    renderModal();
    await openModal();

    await widget.act('close');

    // Same real-transition timing note as OPEN-002.
    await waitFor(() => expect(exposed()).toBe(false));
    await waitFor(() => expect(modalBody()).not.toBeInTheDocument(), { timeout: 3000 });
  });
});

describe('ModalV2: onOpen/onClose events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-EVT-001] onOpen fires exactly once when the modal is opened', async () => {
    // Break this catches: onShow firing more than once per open, or not at all
    // (regression c40fda1ac7).
    renderModal({ events: ON_OPEN_CAPTURE });

    await openModal();

    await waitFor(() => expect(handlerSaw()).toBe('YES'));
  });

  test('[ModalV2-EVT-002] onClose fires exactly once when the modal is closed', async () => {
    // Break this catches: hideModal not firing onClose, or firing it more than
    // once per close (regression 269a581808).
    renderModal({ events: ON_CLOSE_CAPTURE });
    await openModal();
    await waitFor(() => expect(closeButton()).toBeInTheDocument());

    await widget.session.user.click(closeButton());

    await waitFor(() => expect(handlerSaw()).toBe('YES'));
  });

  test('[ModalV2-EVT-003] hideOnEsc and closeOnClickingOutside both enabled close independently without double-firing onClose', async () => {
    renderModal({
      properties: { hideOnEsc: binding('{{true}}'), closeOnClickingOutside: binding('{{true}}') },
      events: ON_CLOSE_CAPTURE,
    });
    await openModal();

    rtlFireEvent.keyDown(modalBody(), { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(exposed()).toBe(false));
    expect(handlerSaw()).toBe('YES');
  });
});

describe('ModalV2: Escape key', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-ESC-001] hideOnEsc: true closes the modal on Escape', async () => {
    renderModal({ properties: { hideOnEsc: binding('{{true}}') } });
    await openModal();

    rtlFireEvent.keyDown(modalBody(), { key: 'Escape', code: 'Escape' });

    await waitFor(() => expect(exposed()).toBe(false));
  });

  test('[ModalV2-ESC-002] hideOnEsc: false keeps the modal open on Escape', async () => {
    // Break this catches: Components/Modal.jsx's onEscapeKeyDown dropping its
    // `if (hideOnEsc)` guard.
    renderModal({ properties: { hideOnEsc: binding('{{false}}') } });
    await openModal();

    rtlFireEvent.keyDown(modalBody(), { key: 'Escape', code: 'Escape' });

    expect(exposed()).toBe(true);
    expect(modalBody()).toBeInTheDocument();
  });
});

describe('ModalV2: outside click', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-OUTSIDE-001] closeOnClickingOutside: true closes the modal on an outside click', async () => {
    renderModal({ properties: { closeOnClickingOutside: binding('{{true}}') } });
    await openModal();

    // handleClickOutside (useResizeSideEffects.js) checks
    // parentRef.current.parentElement.parentElement.parentElement === event.target,
    // i.e. three ancestors up from the modal-body ref — the outer dialog wrapper.
    const outside = modalBody().parentElement.parentElement.parentElement;
    rtlFireEvent.mouseDown(outside, { target: outside });

    await waitFor(() => expect(exposed()).toBe(false));
  });

  test('[ModalV2-OUTSIDE-002] closeOnClickingOutside: false keeps the modal open on an outside click', async () => {
    // Break this catches: the outside-click listener attaching unconditionally
    // instead of gating on `closeOnClickingOutside` (useResizeSideEffects.js).
    renderModal({ properties: { closeOnClickingOutside: binding('{{false}}') } });
    await openModal();

    const outside = modalBody().parentElement.parentElement.parentElement;
    rtlFireEvent.mouseDown(outside, { target: outside });

    expect(exposed()).toBe(true);
    expect(modalBody()).toBeInTheDocument();
  });
});

describe('ModalV2: state precedence (client action versus property)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-STATE-001] setVisibility survives an unrelated property re-resolve', async () => {
    // Break this catches: useExposeState's `useEffect(() => setVisibility(visibleState),
    // [visibleState])` widening its dependency array beyond `[visibleState]`.
    renderModal({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());

    await widget.act('setVisibility', false);
    await waitFor(() => expect(triggerButton()).not.toBeInTheDocument());

    // Unrelated re-resolve: trigger label changes, `visibility` property stays true.
    renderModal({ properties: { visibility: binding('{{true}}'), triggerButtonLabel: binding('Changed') } });

    expect(exposed('isVisible')).toBe(false);
    expect(triggerButton()).not.toBeInTheDocument();
  });

  test('[ModalV2-STATE-002] setDisableTrigger survives an unrelated property re-resolve', async () => {
    renderModal({ properties: { disabledTrigger: binding('{{false}}') } });
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton()).not.toBeDisabled();

    await widget.act('setDisableTrigger', true);
    await waitFor(() => expect(triggerButton()).toBeDisabled());

    renderModal({ properties: { disabledTrigger: binding('{{false}}'), triggerButtonLabel: binding('Changed') } });

    expect(triggerButton()).toBeDisabled();
  });

  test('[ModalV2-STATE-003] setDisableModal survives an unrelated property re-resolve', async () => {
    renderModal({ properties: { disabledModal: binding('{{false}}') } });
    await openModal();
    expect(document.getElementById(`${ID}-body-disabled`)).not.toBeInTheDocument();

    await widget.act('setDisableModal', true);
    await waitFor(() => expect(document.getElementById(`${ID}-body-disabled`)).toBeInTheDocument());

    renderModal({ properties: { disabledModal: binding('{{false}}'), triggerButtonLabel: binding('Changed') } });

    expect(document.getElementById(`${ID}-body-disabled`)).toBeInTheDocument();
  });

  test('[ModalV2-STATE-004] setLoading survives an unrelated property re-resolve', async () => {
    renderModal({ properties: { loadingState: binding('{{false}}') } });
    await openModal();

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    renderModal({ properties: { loadingState: binding('{{false}}'), triggerButtonLabel: binding('Changed') } });

    expect(exposed('isLoading')).toBe(true);
  });
});

describe('ModalV2: trigger button', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-TRIG-001] disabledTrigger disables the real trigger button', async () => {
    renderModal({ properties: { disabledTrigger: binding('{{true}}') } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton()).toBeDisabled();
  });

  test('[ModalV2-TRIG-002] visibility: false hides the trigger button via display:none while isVisible stays observable', async () => {
    renderModal({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(triggerButton()).not.toBeInTheDocument();
  });

  test('[ModalV2-TRIG-003] the trigger button icon renders only when iconVisibility is on, using the configured icon/color', async () => {
    renderModal({
      styles: { iconVisibility: { value: true }, icon: { value: 'IconHome2' }, iconColor: { value: '#ff0000' } },
    });
    // TablerIcon dynamically `import()`s @tabler/icons-react before rendering
    // the real <svg>, so the icon lags one microtask/macrotask behind the button.
    await waitFor(() => expect(triggerButton()?.querySelector('svg')).toBeInTheDocument());

    renderModal({ styles: { iconVisibility: { value: false } } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton().querySelector('svg')).not.toBeInTheDocument();
  });

  test('[ModalV2-TRIG-004] direction: left reverses the trigger button content order and alignment mapping', async () => {
    renderModal({ styles: { direction: { value: 'left' }, triggerButtonContentAlignment: { value: 'right' } } });
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    // Break this catches: stylesFactory.js's `isReverseDirection` mapping —
    // `direction: 'left'` must flip 'right' to `flex-start`, not `flex-end`.
    expect(triggerButton()).toHaveStyle({ flexDirection: 'row-reverse', justifyContent: 'flex-start' });

    renderModal({ styles: { direction: { value: 'right' }, triggerButtonContentAlignment: { value: 'right' } } });
    await waitFor(() => expect(triggerButton()).toHaveStyle({ flexDirection: 'row' }));
    expect(triggerButton()).toHaveStyle({ justifyContent: 'flex-end' });
  });

  test('[ModalV2-TRIG-005] an invalid triggerButtonTextSize falls back to the 14px-derived values instead of NaN', async () => {
    renderModal({ styles: { triggerButtonTextSize: { value: 'not-a-number' } } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    const label = triggerButton().querySelector('span');
    expect(label).toHaveStyle({ fontSize: '14px', lineHeight: `${14 * 1.42}px` });
  });

  test('[ModalV2-TRIG-006] triggerButtonFontWeight: medium maps to numeric weight 500', async () => {
    renderModal({ styles: { triggerButtonFontWeight: { value: 'medium' } } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton().querySelector('span')).toHaveStyle({ fontWeight: '500' });
  });
});

describe('ModalV2: header/footer', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-HEADER-001] showHeader: false hides the header', async () => {
    renderModal({ properties: { showHeader: binding('{{false}}') } });
    await openModal();

    expect(document.querySelector('[data-cy="modal-header"]')).not.toBeInTheDocument();
  });

  test('[ModalV2-HEADER-002] hideCloseButton: true hides the close control', async () => {
    renderModal({ properties: { hideCloseButton: binding('{{true}}') } });
    await openModal();

    expect(closeButton()).not.toBeInTheDocument();
  });

  test('[ModalV2-HEADER-003] disabledModal renders disabled overlays over header/body/footer and blocks drop on them', async () => {
    renderModal({ properties: { disabledModal: binding('{{true}}') } });
    await openModal();

    const bodyOverlay = document.getElementById(`${ID}-body-disabled`);
    const headerOverlay = document.getElementById(`${ID}-header-disabled`);
    const footerOverlay = document.getElementById(`${ID}-footer-disabled`);
    expect(bodyOverlay).toBeInTheDocument();
    expect(headerOverlay).toBeInTheDocument();
    expect(footerOverlay).toBeInTheDocument();

    // Break this catches: the body overlay's `onDrop` handler dropping its
    // `stopPropagation()` call, letting a drop reach the canvas underneath.
    const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
    const stopSpy = jest.spyOn(dropEvent, 'stopPropagation');
    bodyOverlay.dispatchEvent(dropEvent);
    expect(stopSpy).toHaveBeenCalled();
  });

  test('[ModalV2-FOOTER-001] showFooter: false hides the footer', async () => {
    renderModal({ properties: { showFooter: binding('{{false}}') } });
    await openModal();

    expect(document.querySelector('[data-cy="modal-footer"]')).not.toBeInTheDocument();
  });

  test('[ModalV2-FOOTER-002] shift-clicking inside the modal body does not select the modal as the clicked component', async () => {
    // Break this catches: Components/Modal.jsx's `handleModalSlotClick` dropping
    // its `isShiftPressed` guard (regression bb702c0852).
    renderModal();
    await openModal();
    const setSelectedComponentAsModal = jest.spyOn(store(), 'setSelectedComponentAsModal');

    rtlFireEvent.click(modalBody(), { shiftKey: true });

    expect(setSelectedComponentAsModal).not.toHaveBeenCalled();
    setSelectedComponentAsModal.mockRestore();
  });
});

describe('ModalV2: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-ACT-001] every action declared in the schema is exposed as a callable', async () => {
    renderModal();
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());

    // Exactly the `actions` list in WidgetManager/widgets/modalV2.js.
    for (const handle of ['open', 'close', 'setVisibility', 'setDisableTrigger', 'setDisableModal', 'setLoading']) {
      await waitFor(() => expect(typeof exposed(handle)).toBe('function'));
    }
  });
});

describe('ModalV2: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-STYLE-001] header/body/footer background colors apply, with the dark-mode white override', async () => {
    renderModal({
      styles: {
        headerBackgroundColor: { value: '#fff' },
        bodyBackgroundColor: { value: '#fff' },
        footerBackgroundColor: { value: '#fff' },
      },
      darkMode: true,
    });
    await openModal();

    // Break this catches: stylesFactory.js dropping the
    // `['#fff','#ffffffff'].includes(...) && darkMode` override.
    expect(document.querySelector('[data-cy="modal-header"]')).toHaveStyle({ backgroundColor: '#1F2837' });
    expect(modalBody()).toHaveStyle({ backgroundColor: '#1F2837' });
    expect(document.querySelector('[data-cy="modal-footer"]')).toHaveStyle({ backgroundColor: '#1F2837' });
  });

  test('[ModalV2-STYLE-002] headerDividerColor/footerDividerColor set the corresponding CSS custom property', async () => {
    renderModal({
      styles: { headerDividerColor: { value: '#123456' }, footerDividerColor: { value: '#654321' } },
    });
    await openModal();

    expect(
      document.querySelector('[data-cy="modal-header"]').style.getPropertyValue('--cc-modal-header-divider-color')
    ).toBe('#123456');
    expect(
      document.querySelector('[data-cy="modal-footer"]').style.getPropertyValue('--cc-modal-footer-divider-color')
    ).toBe('#654321');
  });

  test('[ModalV2-STYLE-003] triggerButtonBackgroundColor/TextColor/BoxShadow apply to the trigger button', async () => {
    renderModal({
      styles: {
        triggerButtonBackgroundColor: { value: '#112233' },
        triggerButtonTextColor: { value: '#445566' },
        boxShadow: { value: '0 0 5px black' },
      },
    });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton()).toHaveStyle({
      backgroundColor: '#112233',
      color: '#445566',
      boxShadow: '0 0 5px black',
    });
  });

  test('[ModalV2-STYLE-004] triggerButtonHoverBackgroundMode: manual uses the configured color only when one is set', async () => {
    renderModal({
      styles: {
        triggerButtonBackgroundColor: { value: '#112233' },
        triggerButtonHoverBackgroundMode: { value: 'manual' },
        triggerButtonHoverBackgroundColor: { value: '#ff0000' },
      },
    });
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton().style.getPropertyValue('--tblr-btn-color-darker')).toBe('#ff0000');

    // Break this catches: stylesFactory.js's manual-mode `||` fallback losing
    // its guard — manual mode with NO chosen color must still fall back to the
    // computed hover shade rather than rendering an empty/invalid value.
    renderModal({
      styles: {
        triggerButtonBackgroundColor: { value: '#112233' },
        triggerButtonHoverBackgroundMode: { value: 'manual' },
        triggerButtonHoverBackgroundColor: { value: '' },
      },
    });
    await waitFor(() => expect(triggerButton().style.getPropertyValue('--tblr-btn-color-darker')).not.toBe(''));
    expect(triggerButton().style.getPropertyValue('--tblr-btn-color-darker')).not.toBe('#ff0000');
  });
});

describe('ModalV2: saved-app compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-COMPAT-001] a definition predating collapseWhenHidden/dynamicHeight/tooltip still renders with pre-feature defaults', async () => {
    // Break this catches: ModalV2.jsx reading any of these three properties
    // without a falsy-safe default, crashing or misrendering the moment a real
    // pre-migration saved definition (never had the key at all) reaches the widget.
    const definition = componentDefinition(ID, NAME, 'ModalV2', {
      visibility: rawBinding('{{true}}'),
      useDefaultButton: rawBinding('{{true}}'),
      triggerButtonLabel: rawBinding('Launch Modal'),
      showHeader: rawBinding('{{true}}'),
      showFooter: rawBinding('{{true}}'),
      size: rawBinding('lg'),
      modalHeight: rawBinding('{{400}}'),
      // collapseWhenHidden, dynamicHeight, tooltip deliberately omitted.
    });
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(
      <PageWrapper>
        <RenderWidget {...widgetProps(ID, 'ModalV2')} />
      </PageWrapper>
    );

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton()).toHaveTextContent('Launch Modal');
    expect(triggerButton()).not.toBeDisabled();
  });

  test('[ModalV2-COMPAT-002] a definition with no resize-set headerHeight/footerHeight falls back to 80/80', async () => {
    const definition = componentDefinition(ID, NAME, 'ModalV2', {
      visibility: rawBinding('{{true}}'),
      useDefaultButton: rawBinding('{{true}}'),
      showHeader: rawBinding('{{true}}'),
      showFooter: rawBinding('{{true}}'),
      size: rawBinding('lg'),
      modalHeight: rawBinding('{{400}}'),
      // headerHeight, footerHeight deliberately omitted.
    });
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);

    widget.session.render(
      <PageWrapper>
        <RenderWidget {...widgetProps(ID, 'ModalV2')} />
      </PageWrapper>
    );
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    await widget.session.user.click(triggerButton());
    await waitFor(() => expect(modalBody()).toBeInTheDocument());

    expect(document.querySelector('[data-cy="modal-header"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="modal-footer"]')).toBeInTheDocument();
  });
});

describe('ModalV2: accessibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-A11Y-001] the trigger button is a real, keyboard-operable button that reflects its disabled state', async () => {
    renderModal({ properties: { disabledTrigger: binding('{{true}}') } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    expect(triggerButton().tagName).toBe('BUTTON');
    expect(triggerButton()).toBeDisabled();
  });
});

describe('ModalV2: size', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-SIZE-001] size: fullscreen enables the dialog scrollable behavior; other sizes disable it', async () => {
    // Break this catches: ModalV2.jsx reverting `scrollable={isFullScreen}` back
    // to an unconditional `true` (the exact hotfix regression on this branch —
    // commits 212d90f07b, 644fe0584d).
    renderModal({ properties: { size: binding('fullscreen') } });
    await openModal();
    expect(document.querySelector('.modal-dialog')).toHaveClass('modal-dialog-scrollable');

    renderModal({ properties: { size: binding('lg') } });
    await openModal();
    expect(document.querySelector('.modal-dialog')).not.toHaveClass('modal-dialog-scrollable');
  });

  test('[ModalV2-SIZE-002] size: fullscreen computes the canvas height via the viewport calc() formula', async () => {
    // Header/footer each render their own mini `SubContainer` (also tagged
    // `data-cy="real-canvas"`) via HorizontalSlot, so the body's own canvas
    // must be found by its distinct id (`canvas-<componentId>`,
    // AppCanvas/Container.jsx:311), not the ambiguous data-cy.
    const bodyCanvas = () => document.getElementById(`canvas-${ID}`);

    renderModal({ properties: { size: binding('fullscreen') } });
    await openModal();
    expect(bodyCanvas()).toHaveAttribute('canvas-height', 'calc(100vh - 48px - 40px - 80px - 80px)');

    renderModal({ properties: { size: binding('lg') } });
    await openModal();
    expect(bodyCanvas()).toHaveAttribute('canvas-height', '240px');
  });
});

describe('ModalV2: modalHeight and header/footer height math', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-HEIGHT-002] a modalHeight of 0 (or an all-zero string) collapses the modal to the 5px degenerate case', async () => {
    // Break this catches: helpers/utils.js's `isFalsyOrMultipleZeros` guard
    // being dropped from Components/Modal.jsx's height-setting effect.
    renderModal({ properties: { modalHeight: binding('{{0}}') } });
    await openModal();

    await waitFor(() => expect(document.querySelector(`.tj-modal-content-${ID}`)).toHaveStyle({ height: '5px' }));

    renderModal({ properties: { modalHeight: binding('00') } });
    await openModal();

    await waitFor(() => expect(document.querySelector(`.tj-modal-content-${ID}`)).toHaveStyle({ height: '5px' }));
  });

  test('[ModalV2-HEIGHT-003] showHeader/showFooter subtract their configured heights from the computed body height', () => {
    // Pure function, Layer: Unit — no rendering needed.
    expect(getModalBodyHeight(400, true, true, 80, 80)).toBe('240px');
    expect(getModalBodyHeight(400, true, false, 80, 80)).toBe('320px');
    expect(getModalBodyHeight(400, false, true, 80, 80)).toBe('320px');
    expect(getModalBodyHeight(400, false, false, 80, 80)).toBe('400px');
  });

  test('[ModalV2-HEIGHT-004] dynamicHeight only takes effect in Viewer mode; the editor canvas keeps the static height', async () => {
    // Break this catches: ModalV2.jsx's `isDynamicHeightEnabled = dynamicHeight
    // && currentMode === 'view'` losing the `currentMode` check.
    const definition = componentDefinition(ID, NAME, 'ModalV2', {
      ...DEFAULT_PROPERTIES,
      dynamicHeight: binding('{{true}}'),
    });
    definition.component.definition.styles = DEFAULT_STYLES;
    seedApp({ [ID]: definition }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);
    widget.session.render(
      <PageWrapper>
        <RenderWidget {...widgetProps(ID, 'ModalV2', { currentMode: 'edit' })} />
      </PageWrapper>
    );
    await openModal();
    expect(document.querySelector(`.dynamic-${ID}`)).not.toBeInTheDocument();

    store().setCurrentMode('view', MODULE_ID);
    widget.session.render(
      <PageWrapper>
        <RenderWidget {...widgetProps(ID, 'ModalV2', { currentMode: 'view' })} />
      </PageWrapper>
    );
    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    await widget.session.user.click(triggerButton());

    await waitFor(() => expect(document.querySelector(`.dynamic-${ID}`)).toBeInTheDocument());
  });

  test('[ModalV2-HEIGHT-005] resizing the header slot writes headerHeight back to the store via setComponentProperty', async () => {
    // Break this catches: Components/Modal.jsx's `updateHeaderSizeInStore`
    // dropping its `setComponentProperty(id, 'headerHeight', ...)` call, or
    // wiring it to the wrong property/paramType.
    renderModal();
    await openModal();
    const rawHeaderHeight = () =>
      store().getComponentDefinition(ID, MODULE_ID)?.component?.definition?.properties?.headerHeight?.value;
    expect(rawHeaderHeight()).toBe(80);
    const handle = document.querySelector('.jet-modalv2-header .resize-handle');
    expect(handle).toBeInTheDocument();

    rtlFireEvent.mouseDown(handle, { clientY: 0 });
    rtlFireEvent.mouseMove(document, { clientY: 40 });
    rtlFireEvent.mouseUp(document);

    // jsdom never computes real layout, so the dragged element's `clientHeight`
    // (what the resize hook reads on mouseup) is always 0 — the real, provable
    // guarantee here is that a store write reaches `headerHeight` at all, not
    // its exact numeric value (HEIGHT-006 covers the height MATH separately).
    await waitFor(() => expect(rawHeaderHeight()).toBe(0));
  });

  test('[ModalV2-HEIGHT-006] headerMaxHeight/footerMaxHeight format as a calc() string in fullscreen and a plain number otherwise', async () => {
    renderModal({ properties: { size: binding('fullscreen') } });
    await openModal();
    // HorizontalSlot's slotStyle sets maxHeight directly from Header.jsx's
    // computed headerMaxHeight — a calc() string in fullscreen.
    expect(document.querySelector('[data-cy="modal-header"] > div > div')).toHaveStyle({
      maxHeight: 'calc(100vh - 80px - 100px - 10px)',
    });

    renderModal({ properties: { size: binding('lg') } });
    await openModal();
    expect(document.querySelector('[data-cy="modal-header"] > div > div')).toHaveStyle({
      maxHeight: `${parseInt('400', 10) - parseInt('80', 10) - 100 - 10}px`,
    });
  });
});

describe('ModalV2: canvas scroll lock', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const canvasContent = () => document.querySelector('.canvas-content');

  // Fixed (previously characterized per D-02, decision recorded 2026-09-15):
  // `ModalV2.jsx`'s `container` prop was resolved eagerly at render time
  // (`document.getElementsByClassName('tj-canvas-area')?.[0] || ...`), which
  // returns nothing on the render before the canvas has committed. That raced
  // `onShowSideEffects` (tied only to `[showModal]`, never reruns) against
  // `@restart/ui`'s own portal-target resolution, so the canvas scroll lock
  // could silently never engage. Passing `container` as a function instead
  // lets `@restart/ui`'s `useWaitForDOMRef` resolve it lazily, post-commit,
  // exactly as that hook is designed to be used — removing the race.
  test('[ModalV2-SCROLL-001] opening locks canvas scroll; closing it restores scroll', async () => {
    renderModal();
    expect(canvasContent()).not.toHaveStyle({ overflow: 'hidden' });

    await openModal();
    await waitFor(() => expect(canvasContent()).toHaveStyle({ overflow: 'hidden' }));

    await widget.act('close');
    await waitFor(() => expect(canvasContent()).toHaveStyle({ overflow: 'auto' }));
  });

  test('[ModalV2-SCROLL-002] with two modals open, closing one does not restore scroll while the other stays open', async () => {
    // Break this catches: helpers/sideEffects.js's `onHideSideEffects` dropping
    // its `hasManyModalsOpen` guard and unconditionally restoring scroll.
    const SECOND_ID = 'modal2';
    const first = componentDefinition(ID, NAME, 'ModalV2', DEFAULT_PROPERTIES);
    first.component.definition.styles = DEFAULT_STYLES;
    const second = componentDefinition(SECOND_ID, 'modal2', 'ModalV2', DEFAULT_PROPERTIES);
    second.component.definition.styles = DEFAULT_STYLES;
    seedApp({ [ID]: first, [SECOND_ID]: second }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);
    widget.session.render(
      <PageWrapper>
        <RenderWidget {...widgetProps(ID, 'ModalV2')} />
        <RenderWidget {...widgetProps(SECOND_ID, 'ModalV2')} />
      </PageWrapper>
    );
    await openModal();
    const secondTrigger = () => document.querySelector(`[data-cy="${SECOND_ID}-launch-button"]`);
    await waitFor(() => expect(secondTrigger()).toBeInTheDocument());
    await widget.session.user.click(secondTrigger());
    await waitFor(() => expect(document.querySelectorAll('[data-cy="modal-body"]')).toHaveLength(2));
    await waitFor(() => expect(canvasContent()).toHaveStyle({ overflow: 'hidden' }));

    await widget.act('close');

    // Still locked: the second modal is still open.
    expect(canvasContent()).toHaveStyle({ overflow: 'hidden' });
  });

  test('[ModalV2-SCROLL-003] unmounting the modal while it is still open still releases the canvas scroll lock', async () => {
    // Break this catches: ModalV2.jsx's unmount-only cleanup effect (the fix
    // for regression ff697ed997) losing its `showModalRef.current` check or
    // its call to `onHideSideEffects`.
    //
    // The "locked" precondition is established directly via the real,
    // unmocked `onShowSideEffects` (not by opening through the trigger) to
    // keep this test independent of SCROLL-001's known, separately-recorded
    // portal-timing race (D-02) — this scenario's own guarantee is the
    // unmount cleanup, not the initial lock.
    renderModal();
    await openModal();
    onShowSideEffects();
    await waitFor(() => expect(canvasContent()).toHaveStyle({ overflow: 'hidden' }));

    // Re-render the SAME root with the modal gone entirely — simulates a page
    // switch unmounting it without ever going through the normal close path.
    widget.session.render(<PageWrapper>{null}</PageWrapper>);

    await waitFor(() => expect(canvasContent()).toHaveStyle({ overflow: 'auto' }));
  });
});

// Migrated from src/AppBuilder/AppCanvas/__tests__/integration/widgetTooltipScope.spec.jsx
// per this contract's Existing-test-audit ("Move") — these two describe blocks
// were ModalV2-specific but lived in the shared AppCanvas test directory,
// against this skill's Phase 5 constraint #1. The file's third describe
// (regression guard for Button, an unrelated widget) stays there.
describe('ModalV2: tooltip scoping', () => {
  const TOOLTIP_TEXT = 'Helpful info';

  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ModalV2-TOOLTIP-001] data-state (the Radix tooltip trigger marker) lands on the launch button, not the widget wrapper', async () => {
    renderModal({ properties: { tooltip: binding(TOOLTIP_TEXT) } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    const widgetWrapper = document.querySelector(`[data-cy="draggable-widget-${ID}"]`);

    expect(widgetWrapper).toBeInTheDocument();
    expect(widgetWrapper).not.toHaveAttribute('data-state'); // bug: wrapper used to be the trigger
    expect(triggerButton()).toHaveAttribute('data-state'); // fix: only the button is
  });

  test('[ModalV2-TOOLTIP-002] hovering the launch button shows the tooltip; hovering elsewhere in the widget does not', async () => {
    renderModal({ properties: { tooltip: binding(TOOLTIP_TEXT) } });

    await waitFor(() => expect(triggerButton()).toBeInTheDocument());
    const widgetWrapper = document.querySelector(`[data-cy="draggable-widget-${ID}"]`);

    // Stand-in for hovering the open (portaled) modal body — the actual bug.
    await act(async () => {
      rtlFireEvent.pointerMove(widgetWrapper);
    });
    await new Promise((resolve) => setTimeout(resolve, 700)); // past Radix's 500ms open delay
    expect(screen.queryByText(TOOLTIP_TEXT)).not.toBeInTheDocument();

    await act(async () => {
      rtlFireEvent.pointerMove(triggerButton());
    });
    // Radix duplicates the text (visible + visually-hidden a11y span) — assert by data-cy, not text.
    await waitFor(() => expect(document.querySelector('[data-cy="widget-tooltip"]')).toHaveTextContent(TOOLTIP_TEXT), {
      timeout: 2000,
    });
  });
});
