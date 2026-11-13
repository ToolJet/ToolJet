import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { OptionsEditor } from '../OptionsEditor';

const renderDetails = () => {
  const onChange = jest.fn();
  const { container } = render(
    <OptionsEditor value={[{ label: 'Day', value: 'day' }]} onChange={onChange} darkMode={false} cyLabel="options" />
  );
  fireEvent.click(container.querySelector('[data-cy="options-row-0"]'));
  return onChange;
};

describe('OptionsEditor value type dropdown', () => {
  it('is the inspector select, not the browser <select>', () => {
    renderDetails();
    expect(document.querySelector('select')).toBeNull();
    expect(document.querySelector('[data-cy="dropdown-options-option-value-type"]')).not.toBeNull();
  });

  it('opens its menu above the popover (1060) and changes the value type', () => {
    const onChange = renderDetails();
    const wrapper = document.querySelector('[data-cy="dropdown-options-option-value-type"]');
    fireEvent.keyDown(wrapper.querySelector('input'), { key: 'ArrowDown' });

    const portal = document.querySelector('.react-select__menu').parentElement;
    expect(Number(portal.style.zIndex || getComputedStyle(portal).zIndex)).toBeGreaterThan(1060);

    fireEvent.click(screen.getByText('True / false'));
    expect(onChange).toHaveBeenCalledWith([{ label: 'Day', value: false }]);
  });
});
