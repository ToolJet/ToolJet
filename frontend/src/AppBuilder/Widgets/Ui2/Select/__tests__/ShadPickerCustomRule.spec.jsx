/**
 * UI 2.0 Select, Combobox and Multiselect: a custom validation rule that reads the picker's own value rejects a picked
 * false, 0 or '' and the onSelect handler already reads isValid false. From the release audit's
 * reviewPickerCustomValidation fixture. Titles carry [ShadSelect-VAL-NNN] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
test.each(
  ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'].flatMap((type) => [false, 0, ''].map((value) => [type, value]))
)(
  '[ShadSelect-VAL-010] %s custom rule rejects exact %p selection and recovers',
  async (type, value) => {
    const w = createWidgetHarness({
      componentType: type,
      id: 'picker1',
      handle: 'picker1',
      widgetHeight: 150,
      widgetWidth: 500,
    });
    await w.setup();
    try {
      const multi = type === 'ShadMultiselect',
        field = multi ? 'values' : 'value';
      const predicate = multi
        ? 'components.picker1.values?.some(v => v === ' + JSON.stringify(value) + ')'
        : 'components.picker1.selectedOption?.label === "Rejected" && components.picker1.value === ' +
          JSON.stringify(value);
      w.render({
        currentMode: 'view',
        properties: {
          options: binding(
            '{{' +
              JSON.stringify([
                { label: 'Rejected', value },
                { label: 'Allowed', value: 'ok' },
              ]) +
              '}}'
          ),
          defaultValue: binding(multi ? '{{[]}}' : '{{null}}'),
        },
        validation: {
          mandatory: binding('{{true}}'),
          customRule: binding('{{' + predicate + ' ? "Not permitted" : ""}}'),
        },
      });
      await waitFor(() => expect(w.exposed().isValid).toBe(false));
      w.setEvents(
        setVariableOn('picker1', 'onSelect', {
          value: '{{({valid:components.picker1.isValid,value:components.picker1.' + field + '})}}',
        })
      );
      const trigger = screen.getByRole('combobox');
      if (type === 'ShadSelect') fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      else fireEvent.click(trigger);
      fireEvent.click(await screen.findByRole('option', { name: 'Rejected' }));
      await waitFor(() =>
        expect(w.variables().seen).toEqual({
          valid: false,
          value: multi ? [value] : value,
        })
      );
      expect(w.exposed().isValid).toBe(false);
      await w.act('clear');
      await w.act(multi ? 'selectOptions' : 'selectOption', multi ? ['ok'] : 'ok');
      expect(w.exposed().isValid).toBe(true);
      expect(w.exposed()[field]).toEqual(multi ? ['ok'] : 'ok');
      await w.act('clear');
      expect(w.exposed().isValid).toBe(false);
    } finally {
      w.teardown();
    }
  },
  15000
);
