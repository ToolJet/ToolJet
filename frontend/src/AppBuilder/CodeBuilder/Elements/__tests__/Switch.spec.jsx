import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Switch from '../Switch';

// JSDOM has no text layout. Supply only the browser's measured text widths.
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
    return this.hasAttribute('data-segment-measure') ? this.textContent.length * 7 : 0;
  });
});
afterEach(() => jest.restoreAllMocks());
const options = (labels) => labels.map((displayName) => ({ displayName, value: displayName }));

it('requests a full row when four word options cannot fit the compact column', () => {
  const onLayoutChange = jest.fn();
  render(
    <Switch
      value="Bottom"
      onChange={jest.fn()}
      onLayoutChange={onLayoutChange}
      meta={{ options: options(['Bottom', 'Top', 'Right', 'Left']) }}
    />
  );
  expect(onLayoutChange).toHaveBeenLastCalledWith(true);
});

it('keeps short choices inline and recalculates when option text changes', () => {
  const onLayoutChange = jest.fn();
  const { rerender } = render(
    <Switch
      value="On"
      onChange={jest.fn()}
      onLayoutChange={onLayoutChange}
      meta={{ options: options(['On', 'Off']) }}
    />
  );
  expect(onLayoutChange).toHaveBeenLastCalledWith(false);
  rerender(
    <Switch
      value="On"
      onChange={jest.fn()}
      onLayoutChange={onLayoutChange}
      meta={{ options: options(['On', 'Letters and digits']) }}
    />
  );
  expect(onLayoutChange).toHaveBeenLastCalledWith(true);
});

it('keeps full labels available on hover and does not change layout when selection changes', () => {
  const onLayoutChange = jest.fn();
  const onChange = jest.fn();
  render(
    <Switch
      value="Bottom"
      onChange={onChange}
      onLayoutChange={onLayoutChange}
      meta={{ options: options(['Bottom', 'Top', 'Right', 'Left']) }}
    />
  );
  const count = onLayoutChange.mock.calls.length;
  expect(screen.getByText('Bottom')).toHaveAttribute('title', 'Bottom');
  fireEvent.click(screen.getByText('Left'));
  expect(onChange).toHaveBeenCalledWith('Left');
  expect(onLayoutChange).toHaveBeenCalledTimes(count);
});
