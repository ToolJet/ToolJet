/**
 * `useActiveSlot` is shared by Container, Accordion, Form and ModalV2 — one call per widget
 * instance. It exists for one thing: it tells a sub-canvas slot that it was the last one
 * clicked, which is what reveals that slot's resize handle and accent outline
 * (`form.scss:62,88`). Both of those CSS rules are themselves gated on `.is-editing`.
 *
 * Two properties are asserted here rather than in any widget's contract, because the cost is
 * a property of the HOOK and none of the four widgets owns it:
 *
 *   1. the document listeners do not scale with the number of widgets on the page;
 *   2. nothing is attached at all outside edit mode, where the result cannot be seen.
 *
 * Before this, every instance attached its own `click` and `dblclick` pair and repeated the
 * same ancestor walk, so twenty containers meant forty handlers on every click anywhere on
 * the page — in the released app as much as in the builder.
 *
 * The store is mocked here deliberately and narrowly: this spec is about listener
 * bookkeeping, not store behaviour, and it asserts on the document rather than on the mock.
 */
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';

jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: (selector) => selector({ selectedComponents: [] }),
}));

const Probe = ({ id, isEditing }) => {
  const activeSlot = useActiveSlot(id, isEditing);
  return <div data-testid={`probe-${id}`}>{activeSlot}</div>;
};

/** Counts the click/dblclick handlers added to `document` while `n` probes mount. */
function documentListenersFor(n, isEditing) {
  const add = jest.spyOn(document, 'addEventListener');
  render(
    <>
      {Array.from({ length: n }, (_, i) => (
        <Probe key={i} id={`w${i}`} isEditing={isEditing} />
      ))}
    </>
  );
  const count = add.mock.calls.map(([type]) => type).filter((t) => t === 'click' || t === 'dblclick').length;
  add.mockRestore();
  return count;
}

afterEach(() => cleanup());

describe('useActiveSlot', () => {
  // Break this catches: going back to a listener pair per instance. The assertion is that the
  // count does not GROW with widget count, which is the property that matters — a page with
  // twenty sub-canvas widgets ran forty handlers and forty ancestor walks per click.
  test('document listeners do not scale with the number of widgets', () => {
    expect(documentListenersFor(1, true)).toBe(2);
    cleanup();
    expect(documentListenersFor(20, true)).toBe(2);
  });

  // Break this catches: listening in the viewer. Everything activeSlot drives is gated on
  // `.is-editing`, so outside edit mode the work can never produce a visible result.
  test('nothing is attached outside edit mode', () => {
    expect(documentListenersFor(20, false)).toBe(0);
  });

  // Break this catches: the shared listener failing to fan out, which would leave every slot
  // but one unable to show its resize handle.
  test('every subscriber still learns the slot that was clicked', () => {
    const { getByTestId } = render(
      <>
        <Probe id="w0" isEditing />
        <Probe id="w1" isEditing />
        <div id="canvas-slot-a">
          <span data-testid="target">x</span>
        </div>
      </>
    );

    fireEvent.click(getByTestId('target'));

    expect(getByTestId('probe-w0').textContent).toBe('slot-a');
    expect(getByTestId('probe-w1').textContent).toBe('slot-a');
  });

  // Break this catches: dropping the fallback. A click outside every sub-canvas must leave
  // each widget pointing at itself, not at another widget's slot or at nothing.
  test('a click outside every sub-canvas falls back to the widget itself', () => {
    const { getByTestId } = render(
      <>
        <Probe id="w0" isEditing />
        <span data-testid="outside">x</span>
      </>
    );

    fireEvent.click(getByTestId('outside'));

    expect(getByTestId('probe-w0').textContent).toBe('w0');
  });
});
