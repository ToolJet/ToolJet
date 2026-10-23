// Release audit round 3 (Codex fixture reviewCopyFeedbackOwnership, trimmed): a Key-value copy button showed its check
// against a new value when a copy of the old value finished after the value changed, and a second copy within 1.5s
// did not restart the check, which went off early. The check belongs to the text copied, and each copy shows it in full.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CopyButton } from '@/AppBuilder/Widgets/Ui2/KeyValue/KeyValue';

let prior;
beforeEach(() => {
  prior = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  jest.useFakeTimers();
});
afterEach(() => {
  cleanup();
  jest.useRealTimers();
  if (prior) Object.defineProperty(navigator, 'clipboard', prior);
  else delete navigator.clipboard;
});
const clipboard = (writeText) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
const button = () => screen.getByRole('button', { name: 'Copy value' });
const checked = () => button().querySelector('svg.lucide-check') !== null;

test('a copy of the old value that finishes after the value changed does not mark the new value', async () => {
  let resolve;
  const write = jest.fn(() => new Promise((r) => (resolve = r)));
  clipboard(write);
  const view = render(<CopyButton text="Old value" />);
  fireEvent.click(button());
  view.rerender(<CopyButton text="New value" />);
  await act(async () => resolve());
  expect(write).toHaveBeenCalledWith('Old value');
  expect(checked()).toBe(false);
});

test('a second copy shows the check for its own full 1.5s', async () => {
  const write = jest.fn().mockResolvedValue(undefined);
  clipboard(write);
  render(<CopyButton text="Value" />);
  await act(async () => fireEvent.click(button()));
  expect(checked()).toBe(true);
  act(() => jest.advanceTimersByTime(1400));
  await act(async () => fireEvent.click(button()));
  expect(write).toHaveBeenCalledTimes(2);
  act(() => jest.advanceTimersByTime(1400));
  expect(checked()).toBe(true);
  act(() => jest.advanceTimersByTime(100));
  expect(checked()).toBe(false);
});
