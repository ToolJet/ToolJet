import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { ConditionSelect } from '../ConditionRow';

// jsdom lacks the pointer and scroll APIs Radix Select calls when it opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

describe('ConditionSelect | menu', () => {
  it('marks the selected option with a check and no other', async () => {
    render(
      <ConditionSelect
        value="eq"
        onValueChange={() => {}}
        options={[
          { value: 'eq', label: 'equals' },
          { value: 'ne', label: 'does not equal' },
        ]}
        placeholder="Operation"
        aria-label="Operation"
      />
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Operation' }));

    expect(screen.getByRole('option', { name: 'equals' }).querySelector('svg')).not.toBeNull();
    expect(screen.getByRole('option', { name: 'does not equal' }).querySelector('svg')).toBeNull();
  });
});
