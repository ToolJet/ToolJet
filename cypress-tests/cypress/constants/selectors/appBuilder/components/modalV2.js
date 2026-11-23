// Selectors for the Modal (ModalV2) widget (frontend/src/AppBuilder/Widgets/ModalV2/).
// Pass the runtime name (e.g. "modal1") or, for the open modal's parts, the component id.
// The open modal is portalled into `.tj-canvas-area` (ModalV2.jsx:356-358), outside the widget box, and its
// header/body/footer/close data-cy values are fixed (not per widget) — so an open modal's parts are reached
// through its component id: the body carries id=<componentId> (Components/Modal.jsx:194), the content
// `.tj-modal-content-<componentId>` (Components/Modal.jsx:144) and the slot canvases `canvas-<componentId>[-slot]`.
const box = (name) => `[data-cy="draggable-widget-${name}"]`;

export const modalV2Selector = {
  // RenderWidget box (grid cell holding the trigger)
  draggableWidget: box,
  // WidgetWrapper.jsx — the canvas wrapper (ancestor of the draggable): id = component id
  wrapper: "[component-type]",
  // ModalV2.jsx:298-305 — widget root (data-disabled = isDisabledTrigger)
  root: (name) => `${box(name)} [data-cy="${name}"]`,
  // ModalV2.jsx:308-323 — default trigger <button>
  launchButton: (name) => `[data-cy="${name}-launch-button"]`,

  // react-bootstrap overlay (`.modal`, class `fade modal show`) — one per open modal, no data-cy
  anyOpenModal: ".tj-canvas-area .modal.show, .real-canvas .modal.show",
  // Components/Modal.jsx:141-149 — `.modal-content` of one modal
  content: (componentId) => `.tj-modal-content-${componentId}`,
  // Components/Modal.jsx:194 — the body (fixed data-cy, id = component id)
  body: (componentId) => `[data-cy="modal-body"][id="${componentId}"]`,
  // Header.jsx:25 / Footer.jsx:23 — fixed data-cy, scoped by the modal content
  header: (componentId) => `.tj-modal-content-${componentId} > [data-cy="modal-header"]`,
  footer: (componentId) => `.tj-modal-content-${componentId} > [data-cy="modal-footer"]`,
  // Header.jsx:57-66 — close (X) control
  closeButton: (componentId) => `.tj-modal-content-${componentId} [data-cy="modal-close-button"]`,
  // SubContainer canvases: body `canvas-<id>` (Components/Modal.jsx:207-208), slots `canvas-<id>-header|footer`
  // (Header.jsx:35 / Footer.jsx:32 HorizontalSlot id)
  slotCanvas: (componentId, slot) => (slot === "body" ? `#canvas-${componentId}` : `#canvas-${componentId}-${slot}`),
};
