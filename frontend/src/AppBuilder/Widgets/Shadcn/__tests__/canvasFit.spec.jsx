import React from 'react';
import { act, render } from '@testing-library/react';
import { useCanvasFit } from '../canvasFit';

// A shadcn List view row (and a custom Kanban card) stayed at rowHeight while a child grew, cutting it off: a long
// bound note grew its Text to 116px in a 60px row (headless browser, 2026-10-11). The row now fits its components.
const rects = new Map();
beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(() => cb(0), 0));
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    const r = rects.get(this.dataset?.rect) || { top: 0, bottom: 0, height: 0 };
    return { ...r, left: 0, right: 100, width: 100, x: 0, y: r.top };
  });
});
afterAll(() => jest.restoreAllMocks());
const tick = () => act(() => new Promise((r) => setTimeout(r, 5)));

const Row = ({ fit, base = 60, shrink = false }) => {
  const [ref, height] = useCanvasFit(fit, base, '[data-row]', { shrink });
  return (
    <div ref={ref} data-row="" data-rect="row" data-h={height}>
      <div className="ele-a" data-rect="a" />
      <div data-row="" data-rect="nested">
        <div className="ele-b" data-rect="b" />
      </div>
    </div>
  );
};
const heightOf = (c) => Number(c.querySelector('[data-rect=row]').dataset.h);

it('grows to the bottom of its own components, ignoring a nested row', async () => {
  rects.set('row', { top: 100, bottom: 160, height: 60 });
  rects.set('a', { top: 104, bottom: 220, height: 116 });
  rects.set('b', { top: 104, bottom: 900, height: 796 });
  const { container } = render(<Row fit />);
  await tick();
  expect(heightOf(container)).toBe(128);
});

it('never goes below its base height, and keeps it with fitting off', async () => {
  rects.set('a', { top: 104, bottom: 130, height: 26 });
  const { container, rerender } = render(<Row fit />);
  await tick();
  expect(heightOf(container)).toBe(60);
  rects.set('a', { top: 104, bottom: 400, height: 296 });
  rerender(<Row fit={false} />);
  await tick();
  expect(heightOf(container)).toBe(60);
});

it('with shrink, keeps its base when nothing in it is hidden (cardHeight still sets a static card)', async () => {
  rects.set('row', { top: 100, bottom: 372, height: 272 });
  rects.set('a', { top: 104, bottom: 199, height: 95 });
  const { container } = render(<Row fit shrink base={272} />);
  await tick();
  expect(heightOf(container)).toBe(272);
});

it('leaves out a component whose content is hidden, though its slot keeps a size (one card expanded, the rest not)', async () => {
  // collapseWhenHidden is decided once per component, so expanding one deal card gave every card's hidden details their
  // 134px slots back: the other cards grew to 269px with nothing drawn in the space.
  rects.set('row', { top: 100, bottom: 372, height: 272 });
  rects.set('a', { top: 104, bottom: 199, height: 95 });
  rects.set('hiddenSlot', { top: 220, bottom: 360, height: 140 });
  rects.set('hiddenContent', { top: 220, bottom: 220, height: 0 });
  const Card = () => {
    const [ref, height] = useCanvasFit(true, 272, '[data-row]', { shrink: true });
    return (
      <div ref={ref} data-row="" data-rect="row" data-h={height}>
        <div className="ele-a" data-rect="a" />
        <div className="ele-hidden" data-rect="hiddenSlot">
          <div className="canvas-component">
            <div data-rect="hiddenContent" />
          </div>
        </div>
      </div>
    );
  };
  const { container } = render(<Card />);
  await tick();
  expect(heightOf(container)).toBe(107);
});
