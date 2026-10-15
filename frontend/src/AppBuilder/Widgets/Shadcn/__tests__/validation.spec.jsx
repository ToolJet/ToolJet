import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ShadCheckbox, ShadInput } from '../Shadcn';

// validate() as RenderWidget builds it from the Validation section: here, mandatory.
const mandatory = (value) =>
  value === '' || value === false ? { isValid: false, validationError: 'Field cannot be empty' } : { isValid: true };

const mount = (Widget, properties) => {
  const exposed = {};
  const events = [];
  render(
    <Widget
      id="w1"
      componentType={Widget === ShadInput ? 'ShadInput' : 'ShadCheckbox'}
      properties={{ label: 'Name', ...properties }}
      styles={{}}
      validation={{ mandatory: true }}
      validate={mandatory}
      setExposedVariables={(values) => Object.assign(exposed, values)}
      setExposedVariable={(key, value) => (exposed[key] = value)}
      fireEvent={(name) => events.push(name)}
    />
  );
  return { exposed, events };
};

describe('pack input validation', () => {
  it('exposes isValid and isMandatory, and shows the message only after the field is left', async () => {
    const { exposed, events } = mount(ShadInput, { defaultValue: '' });
    expect(exposed).toMatchObject({ isValid: false, isMandatory: true });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('*')).toBeTruthy();
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toBe('Field cannot be empty');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(events).toContain('onBlur');
    fireEvent.change(input, { target: { value: 'Ada' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(exposed.isValid).toBe(true);
  });

  it('offers setFocus and setBlur', async () => {
    const { exposed } = mount(ShadInput, { defaultValue: 'x' });
    await act(() => exposed.setFocus());
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
    await act(() => exposed.setBlur());
    expect(document.activeElement).not.toBe(screen.getByRole('textbox'));
  });

  it('fails a mandatory checkbox until it is checked, and fires onCheck / onUnCheck', () => {
    const { exposed, events } = mount(ShadCheckbox, { label: 'I agree' });
    expect(exposed.isValid).toBe(false);
    const box = screen.getByRole('checkbox');
    fireEvent.click(box);
    expect(exposed.isValid).toBe(true);
    expect(events).toEqual(['onChange', 'onCheck']);
    fireEvent.click(box);
    expect(screen.getByRole('alert').textContent).toBe('Field cannot be empty');
    expect(events.slice(-2)).toEqual(['onChange', 'onUnCheck']);
  });
});
