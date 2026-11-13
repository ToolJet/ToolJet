/**
 * The canvas offset for the left sidebar lands in the same frame the sidebar opens.
 *
 * Opening the sidebar scrolls the canvas by the sidebar's width and offsets it by that width (a left
 * border). If the offset arrives a render later than the open — it used to be state set from an effect —
 * one frame paints the canvas scrolled but not yet offset, and the whole canvas jumps sideways.
 */
import React, { useRef } from 'react';
import { render, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import useSidebarMargin from '../../useSidebarMargin';
import { LEFT_SIDEBAR_WIDTH } from '../../../appCanvasConstants';

const WIDTH = LEFT_SIDEBAR_WIDTH.default;

let renders;

const Probe = () => {
  const ref = useRef(null);
  const margin = useSidebarMargin(ref);
  renders.push({ open: useStore.getState().isSidebarOpen, margin });
  return (
    <div
      ref={(el) => {
        if (el && !el.scrollTo) {
          // jsdom doesn't scroll; like a browser, clamp at 0 and report the scroll.
          el.scrollTo = ({ left }) => {
            el.scrollLeft = Math.max(0, left);
            el.dispatchEvent(new Event('scroll'));
          };
        }
        ref.current = el;
      }}
      data-testid="canvas-container"
    />
  );
};

describe('left sidebar canvas offset', () => {
  beforeEach(() => {
    renders = [];
    act(() => {
      useStore.getState().setCurrentMode('edit', 'canvas');
      useStore.setState({ isSidebarOpen: false, selectedSidebarItem: 'inspect' });
    });
  });

  it('[SidebarMargin-001] never renders the sidebar open without its offset', () => {
    // Break this catches: deriving the offset in an effect, which leaves a committed frame with the
    // sidebar open, the canvas scrolled by its width, and no offset yet — the visible jump.
    render(<Probe />);

    act(() => useStore.setState({ isSidebarOpen: true }));

    expect(renders.filter((r) => r.open && r.margin !== WIDTH)).toEqual([]);
    expect(renders.at(-1)).toEqual({ open: true, margin: WIDTH });
  });

  it('[SidebarMargin-002] scrolls the canvas by the sidebar width on open and back on close', () => {
    const { getByTestId } = render(<Probe />);
    const canvas = getByTestId('canvas-container');

    act(() => useStore.setState({ isSidebarOpen: true }));
    expect(canvas.scrollLeft).toBe(WIDTH);

    act(() => useStore.setState({ isSidebarOpen: false }));
    expect(canvas.scrollLeft).toBe(0);
    expect(renders.at(-1)).toEqual({ open: false, margin: 0 });
  });
});
