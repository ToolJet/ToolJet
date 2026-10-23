import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A UI 2.0 widget drawn at its box's height fills the box, centres small content in it, and scrolls content that does
 * not fit (the Cypress geometry checks): a Progress bar's 8px root sat at the top of its 40px box, and a Dropdown
 * menu's 36px button in a 20px box painted 18px over the widget below. A fitted widget in the viewer is left alone
 * (its box follows its content), and so is one under the fixed-box policy (Shell's FIXED_BOX).
 */
import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { useBoxFit } from '../boxFit';

let content = { height: 10, width: 100 };
const Probe = ({ type, mode = 'view', contained = false, properties = {} }) => {
  const ref = useRef(null);
  const fit = useBoxFit({ componentType: type, properties, currentMode: mode, height: 36, width: 200 }, ref, contained);
  return (
    <div
      data-probe=""
      className={fit.className}
      style={fit.style}
      ref={(el) => {
        ref.current = el;
        if (el && !Object.getOwnPropertyDescriptor(el, 'scrollHeight')) {
          Object.defineProperty(el, 'scrollHeight', { get: () => content.height });
          Object.defineProperty(el, 'clientHeight', { get: () => 36 });
          Object.defineProperty(el, 'scrollWidth', { get: () => content.width });
          Object.defineProperty(el, 'clientWidth', { get: () => 200 });
        }
      }}
    />
  );
};
const probe = () => document.querySelector('[data-probe]');

beforeEach(() => {
  content = { height: 10, width: 100 };
});

test('a widget that never measures itself fills its box, and small content is centred', () => {
  render(<Probe type="ShadProgress" />);
  expect(probe()).toHaveClass('tw-h-full', 'tw-min-h-0');
  expect(probe()).not.toHaveClass('tw-overflow-auto');
  expect(probe().style.display).toBe('flex');
  expect(probe().style.justifyContent).toBe('safe center');
});

test('content taller than the box scrolls inside it', () => {
  content = { height: 36 + 18, width: 100 };
  render(<Probe type="ShadDropdownMenu" />);
  expect(probe()).toHaveClass('tw-h-full', 'tw-overflow-auto');
  expect(probe().style.display).toBe('');
});

test('a fitted widget in the editor fills its box; in the viewer it is left alone', () => {
  render(<Probe type="ShadInput" mode="edit" />);
  expect(probe()).toHaveClass('tw-h-full');
  const viewer = render(<Probe type="ShadInput" />);
  expect(viewer.container.querySelector('[data-probe]').className).toBe('');
});

test('a widget under the fixed-box policy is left to it', () => {
  render(<Probe type="ShadCalendar" mode="edit" contained />);
  expect(probe().className).toBe('');
});
