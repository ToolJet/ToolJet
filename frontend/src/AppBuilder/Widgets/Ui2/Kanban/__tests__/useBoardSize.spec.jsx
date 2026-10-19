// Audit 2026-10-18: the custom cards' width was measured only when the board was there on the first draw. A board
// first drawn after a loading state was never measured, so its custom cards stayed blank.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useBoardSize } from '@/AppBuilder/Widgets/Ui2/Kanban/useBoardSize';

const collapsed = new Set();
const Probe = ({ shown }) => {
  const { boardNode, cardWidth } = useBoardSize(true, 1, collapsed);
  return (
    <>
      <output data-testid="width">{cardWidth}</output>
      {shown ? (
        <div ref={boardNode}>
          <div data-collapsed="false">Column</div>
        </div>
      ) : null}
    </>
  );
};

let restore;
beforeEach(() => {
  const observer = global.ResizeObserver;
  const width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 300 });
  restore = () => {
    global.ResizeObserver = observer;
    Object.defineProperty(Element.prototype, 'clientWidth', width);
  };
});
afterEach(() => restore());

// A column of 300px, less 24px of padding and the card's 1px borders.
test.each([
  ['there from the start', false],
  ['drawn later', true],
])('the card width follows a board %s', async (_name, later) => {
  const view = render(<Probe shown={!later} />);
  if (later) view.rerender(<Probe shown />);
  await waitFor(() => expect(screen.getByTestId('width')).toHaveTextContent('274'));
});
