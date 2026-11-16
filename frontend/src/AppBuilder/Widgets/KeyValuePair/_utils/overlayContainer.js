// #real-canvas is a transformed stacking context that paints under a modal, so inside a modal the overlay must
// be portaled into the modal itself; elsewhere it stays in the canvas so it can't cover the query panel.
export const getOverlayContainer = (anchor) =>
  anchor?.closest?.('.modal') ?? document.getElementById('real-canvas') ?? document.body;
