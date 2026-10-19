/**
 * A required UI 2.0 picker shows its validation message once the user has left it, whether through its popup or by
 * tabbing past the closed control.
 *
 * Release audit round 3 (18 Oct), Codex fixture reviewPickerValidationDisplay, trimmed: Select, Combobox and
 * Multiselect marked themselves touched only when their popup closed, so focusing and leaving an empty required
 * picker showed nothing (the text inputs show the message on blur). The date and time pickers did the same.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) =>
    ['closed blur', 'popup dismiss'].map((route) => [type, route])
  )
)(
  '%s shows its validation message after %s',
  async (type, route) => {
    const w = createWidgetHarness({
      componentType: type,
      id: 'picker1',
      handle: 'picker1',
      widgetHeight: 150,
      widgetWidth: 500,
    });
    await w.setup();
    try {
      const multi = type === 'ShadMultiselect';
      w.render({
        currentMode: 'view',
        properties: {
          options: binding('{{[{label:"Alpha",value:"a"}]}}'),
          defaultValue: binding(multi ? '{{[]}}' : '{{null}}'),
          description: binding('Choose a record'),
        },
        validation: { mandatory: binding('{{true}}') },
      });
      await waitFor(() => expect(w.exposed().isValid).toBe(false));
      expect(screen.queryByRole('alert')).toBeNull();
      const trigger = screen.getByRole('combobox');
      act(() => trigger.focus());
      if (route === 'closed blur') act(() => trigger.blur());
      else {
        if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        else fireEvent.click(trigger);
        await screen.findByRole('listbox');
        fireEvent.keyDown(document.activeElement, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
      }
      const error = await screen.findByRole('alert');
      expect(error.textContent.trim()).not.toBe('');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAttribute('aria-describedby', error.id);
      // A pick clears it, and the description is read again.
      await w.act(multi ? 'selectOptions' : 'selectOption', multi ? ['a'] : 'a');
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      expect(trigger).not.toHaveAttribute('aria-invalid', 'true');
      expect(document.getElementById(trigger.getAttribute('aria-describedby')).textContent).toBe('Choose a record');
    } finally {
      w.teardown();
    }
  },
  15000
);

test.each(['ShadDatePicker', 'ShadDateTimePicker', 'ShadTimePicker'])(
  '%s shows its validation message after a closed blur',
  async (type) => {
    const w = createWidgetHarness({ componentType: type, id: 'picker1', handle: 'picker1' });
    await w.setup();
    try {
      w.render({
        currentMode: 'view',
        properties: { label: binding('Due'), defaultValue: binding('') },
        validation: { mandatory: binding('{{true}}') },
      });
      await waitFor(() => expect(w.exposed().isValid).toBe(false));
      expect(screen.queryByRole('alert')).toBeNull();
      const trigger = screen.getByRole('button', { name: /Due/ });
      act(() => trigger.focus());
      act(() => trigger.blur());
      const error = await screen.findByRole('alert');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAttribute('aria-describedby', error.id);
    } finally {
      w.teardown();
    }
  },
  15000
);
