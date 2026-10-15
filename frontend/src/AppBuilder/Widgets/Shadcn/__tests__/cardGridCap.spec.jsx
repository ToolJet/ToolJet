import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ShadCardGrid } from '../ShadSections';

// A Card grid bound to 10,000 rows drew every card (over 100,000 elements; in a headless browser 1,000 cards were
// 10,640 elements and an 83 ms frame while scrolling). It draws 48 and a button for the next ones.
const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Customer ${i + 1}`, city: 'Oslo' }));
const mount = (data) => {
  const exposed = {};
  const props = (d) => ({
    id: 'g1',
    componentType: 'ShadCardGrid',
    height: 600,
    width: 900,
    properties: { data: d, titleField: 'name', showImage: false },
    styles: {},
    setExposedVariables: (v) => Object.assign(exposed, v),
    setExposedVariable: (k, v) => (exposed[k] = v),
    fireEvent: () => {},
  });
  const view = render(<ShadCardGrid {...props(data)} />);
  return { view, rerender: (d) => view.rerender(<ShadCardGrid {...props(d)} />) };
};
const cards = () => document.querySelectorAll('[role=button][tabindex="0"]').length;

it('draws the first 48 cards of a big binding, and 48 more per press', () => {
  mount(rows(10000));
  expect(cards()).toBe(48);
  fireEvent.click(screen.getByRole('button', { name: 'Show 48 more of 9952' }));
  expect(cards()).toBe(96);
});

it('draws every card of a small binding with no button, and starts over on new data', () => {
  const { rerender } = mount(rows(20));
  expect(cards()).toBe(20);
  expect(screen.queryByText(/more of/)).toBeNull();
  rerender(rows(100));
  fireEvent.click(screen.getByText('Show 48 more of 52'));
  expect(cards()).toBe(96);
  rerender(rows(200));
  expect(cards()).toBe(48);
});
