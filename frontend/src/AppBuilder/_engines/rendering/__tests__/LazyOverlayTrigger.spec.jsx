import React, { createRef } from 'react';
import { act, render } from '@testing-library/react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import LazyOverlayTrigger from '../LazyOverlayTrigger';

// What a table cell renders: a controlled tooltip over the cell content.
const cell = (Trigger, { show, ref }) => (
  <Trigger
    placement="bottom"
    overlay={<div className="overlay-cell-table">full text</div>}
    trigger={show && ['hover', 'focus']}
    rootClose={true}
    show={show}
  >
    <div ref={ref} className="cell" onFocus={() => {}}>
      text
    </div>
  </Trigger>
);

const overlays = () => document.body.querySelectorAll('.overlay-cell-table').length;

describe('LazyOverlayTrigger', () => {
  test('renders what OverlayTrigger renders while hidden, and the overlay once shown', () => {
    const theirs = render(cell(OverlayTrigger, { show: false }));
    const ours = render(cell(LazyOverlayTrigger, { show: false }));
    expect(ours.container.innerHTML).toBe(theirs.container.innerHTML);
    expect(overlays()).toBe(0);

    act(() => theirs.rerender(cell(OverlayTrigger, { show: true })));
    const shownByTheirs = overlays();
    expect(shownByTheirs).toBeGreaterThan(0);
    act(() => ours.rerender(cell(LazyOverlayTrigger, { show: true })));
    expect(overlays()).toBe(shownByTheirs * 2);
    expect(ours.container.innerHTML).toBe(theirs.container.innerHTML);

    act(() => ours.rerender(cell(LazyOverlayTrigger, { show: false })));
    act(() => theirs.rerender(cell(OverlayTrigger, { show: false })));
    expect(ours.container.innerHTML).toBe(theirs.container.innerHTML);
  });

  test("keeps the child's own ref", () => {
    const ref = createRef();
    render(cell(LazyOverlayTrigger, { show: false, ref }));
    expect(ref.current?.className).toBe('cell');
  });

  test('anything uncontrolled is the real OverlayTrigger', () => {
    const uncontrolled = (Trigger) => (
      <Trigger placement="bottom" overlay={<div className="overlay-cell-table">tip</div>}>
        <button type="button">hover me</button>
      </Trigger>
    );
    const theirs = render(uncontrolled(OverlayTrigger));
    const ours = render(uncontrolled(LazyOverlayTrigger));
    expect(ours.container.innerHTML).toBe(theirs.container.innerHTML);
  });
});
