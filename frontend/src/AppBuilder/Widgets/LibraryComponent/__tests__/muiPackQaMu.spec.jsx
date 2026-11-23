import { fireEvent, renderHook, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';
import { hostValidation } from './fuzz/hostValidation';
import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
import { acceptedTypes, toPropertyType } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';
import { statusColor, usableColor } from '../../../../../../packs/mui/src/lib/ui2/display/timeline';
import { pieLegendPlace } from '../../../../../../packs/mui/src/lib/chartLegend';
import { fixedOrigin } from '../../../../../../packs/mui/src/lib/theme';
import { dropPointAt, useTouchDragRef } from '../../../../../../packs/mui/src/lib/ui2/display/kanban/touchDrag';

installBrowserStubs();

// Material UI pack QA (MU-xx rows). The pack components, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const CITIES = [
  { label: 'Berlin', value: 'berlin' },
  { label: 'Lisbon', value: 'lisbon' },
];
const count = (v, event) => v.events.filter((e) => e === event).length;

describe('MU-02 Alert: Close action', () => {
  test('fires On close, as the close button does', async () => {
    const v = await mountPack('mui', 'Alert', { closable: true });
    await v.run('close');
    expect(v.exposed.open).toBe(false);
    expect(count(v, 'onClose')).toBe(1);
  });

  test('closing an alert that is already closed fires nothing more', async () => {
    const v = await mountPack('mui', 'Alert', { closable: true });
    await v.run('close');
    await v.run('close');
    expect(count(v, 'onClose')).toBe(1);
  });
});

describe('MU-03 Autocomplete free solo: Set value with new text', () => {
  test('shows the text and exposes it', async () => {
    const v = await mountPack('mui', 'Autocomplete', { options: CITIES, freeSolo: true, value: 'my city' });
    await settle();
    await v.run('setValue', 'anything');
    await settle();
    expect(v.exposed.value).toEqual({ label: 'anything', value: 'anything' });
    expect(v.root().querySelector('input').value).toBe('anything');
  });

  test('without free solo, text no option offers still clears the value', async () => {
    const v = await mountPack('mui', 'Autocomplete', { options: CITIES, value: 'berlin' });
    await settle();
    await v.run('setValue', 'anything');
    expect(v.exposed.value).toBeNull();
  });
});

describe('MU-04 Autocomplete: a bare Default value', () => {
  test('is exposed as the picked option', async () => {
    const v = await mountPack('mui', 'Autocomplete', { options: CITIES, value: 'berlin' });
    await settle();
    expect(v.exposed.value).toEqual({ label: 'Berlin', value: 'berlin' });
  });

  test('AutocompleteMultiple: bare values are exposed as picked options', async () => {
    const v = await mountPack('mui', 'AutocompleteMultiple', { options: CITIES, value: ['berlin', 'lisbon'] });
    await settle();
    expect(v.exposed.value).toEqual(CITIES);
  });
});

describe('MU-06 an unknown Variant, Color or Size falls back to the default look', () => {
  const classes = (v, selector) => v.root().querySelector(selector).className;

  test.each([
    ['Button', { variant: 'filled' }, 'button', ['MuiButton-contained', 'MuiButton-colorPrimary']],
    ['Button', { color: 'magenta' }, 'button', ['MuiButton-contained', 'MuiButton-colorPrimary']],
    ['Button', { size: 'huge' }, 'button', ['MuiButton-sizeMedium']],
    ['Menu', { variant: 'notavariant' }, 'button', ['MuiButton-outlined']],
    ['Menu', { variant: 'contained', color: 'magenta' }, 'button', ['MuiButton-contained', 'MuiButton-colorPrimary']],
    [
      'Checkbox',
      { color: 'magenta', size: 'huge' },
      '.MuiCheckbox-root',
      ['MuiCheckbox-colorPrimary', 'MuiCheckbox-sizeMedium'],
    ],
    ['Switch', { color: 'magenta', size: 'huge' }, '.MuiSwitch-root', ['MuiSwitch-sizeMedium']],
    ['RadioGroup', { color: 'magenta', size: 'huge' }, '.MuiRadio-root', ['MuiRadio-colorPrimary']],
    [
      'ToggleButtonGroup',
      { color: 'magenta', size: 'huge' },
      '.MuiToggleButton-root',
      ['MuiToggleButton-primary', 'MuiToggleButton-sizeMedium'],
    ],
    [
      'Slider',
      { color: 'magenta', size: 'huge' },
      '.MuiSlider-root',
      ['MuiSlider-colorPrimary', 'MuiSlider-sizeMedium'],
    ],
    ['Rating', { size: 'huge' }, '.MuiRating-root', ['MuiRating-sizeMedium']],
  ])('%s %j', async (name, props, selector, expected) => {
    const v = await mountPack('mui', name, props);
    await settle();
    for (const c of expected) expect(classes(v, selector)).toContain(c);
  });

  test('Pagination: an unknown colour, variant, shape or size draws the default page buttons', async () => {
    const v = await mountPack('mui', 'Pagination', { color: 'magenta', variant: 'bogus', shape: 'blob', size: 'huge' });
    await settle();
    const picked = v.root().querySelector('.MuiPaginationItem-page.Mui-selected').className;
    expect(picked).toContain('MuiPaginationItem-text');
    expect(picked).toContain('MuiPaginationItem-circular');
    expect(picked).toContain('MuiPaginationItem-sizeMedium');
  });

  test('a listed value still applies', async () => {
    const v = await mountPack('mui', 'Button', { variant: 'outlined', color: 'error', size: 'small' });
    await settle();
    expect(classes(v, 'button')).toEqual(expect.stringContaining('MuiButton-outlined'));
    expect(classes(v, 'button')).toEqual(expect.stringContaining('MuiButton-colorError'));
    expect(classes(v, 'button')).toEqual(expect.stringContaining('MuiButton-sizeSmall'));
  });
});

describe('MU-07 Card Grid: auto columns follow the width', () => {
  const ITEMS = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, title: `Card ${i + 1}` }));
  let spy;
  // The grid's box is `width` px wide (jsdom lays nothing out).
  const boxWidth = (width) => {
    spy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
      return this.classList?.contains('tj-mui-cardgrid') ? width : 0;
    });
  };
  afterEach(() => spy?.mockRestore());
  const columns = (v) => v.root().querySelector('.MuiGrid-container').getAttribute('data-columns');

  test.each([
    [370, 240, '1'],
    [740, 240, '3'],
    [740, 400, '1'],
  ])('a %ipx box with Min card width %i draws %s per row', async (width, minCardWidth, expected) => {
    boxWidth(width);
    const v = await mountPack('mui', 'CardGrid', { dataSource: ITEMS, columns: 0, minCardWidth });
    await settle();
    expect(columns(v)).toBe(expected);
  });

  test('Columns set by hand still applies where it fits', async () => {
    boxWidth(740);
    const v = await mountPack('mui', 'CardGrid', { dataSource: ITEMS, columns: 2, minCardWidth: 240 });
    await settle();
    expect(columns(v)).toBe('2');
  });
});

describe('MU-08 Card Grid: an image that fails to load', () => {
  test('shows the initials panel, as a card with no image does', async () => {
    const rows = [{ id: 1, title: 'Mango Salsa', img: 'https://broken.invalid/x.png' }];
    const v = await mountPack('mui', 'CardGrid', { dataSource: rows, imageField: 'img' });
    await settle();
    const img = v.root().querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img);
    await settle();
    expect(v.root().querySelector('img')).toBeNull();
    expect(v.root().querySelector('.tj-mui-cardgrid__placeholder').textContent).toBe('MS');
  });
});

describe('MU-05 Autocomplete: nothing picked', () => {
  test.each([
    ['Value left out', {}],
    ['Value empty text', { value: '' }],
    ['Value an empty object', { value: {} }],
  ])('%s: value is null', async (_, props) => {
    const v = await mountPack('mui', 'Autocomplete', { options: CITIES, ...props });
    await settle();
    expect(v.exposed.value).toBeNull();
  });
});

describe('MU-09 pickers: a value outside the allowed range is invalid', () => {
  // isValid as the host publishes it, with an empty Validation section.
  const mountValidated = async (name, props) => {
    const published = {};
    const v = await mountPack('mui', name, props, {
      host: { useValidation: hostValidation((key, value) => (published[key] = value)) },
    });
    v.exposed = published;
    return v;
  };
  test.each([
    ['DatePicker', { value: '2025-03-05', minDate: '2025-03-10', maxDate: '2025-03-20' }],
    ['DatePicker', { value: '2025-03-25', minDate: '2025-03-10', maxDate: '2025-03-20' }],
    ['DatePicker', { value: '2001-01-01', disablePast: true }],
    ['DatePicker', { value: '2999-01-01', disableFuture: true }],
    ['DateTimePicker', { value: '2025-03-05T10:00:00', minDateTime: '2025-03-10T09:00:00' }],
    ['DateTimePicker', { value: '2025-03-25T10:00:00', maxDateTime: '2025-03-20' }],
    ['DateTimePicker', { value: '2001-01-01T10:00:00', disablePast: true }],
    ['DateTimePicker', { value: '2999-01-01T10:00:00', disableFuture: true }],
    ['TimePicker', { value: '08:30', minTime: '09:00' }],
    ['TimePicker', { value: '18:30', maxTime: '17:00' }],
  ])('%s %j', async (name, props) => {
    const v = await mountValidated(name, props);
    await settle();
    expect(v.exposed.isValid).toBe(false);
  });

  test.each([
    ['DatePicker', { value: '2025-03-15', minDate: '2025-03-10', maxDate: '2025-03-20' }],
    ['DatePicker', { value: '2025-03-20', maxDate: '2025-03-20' }],
    ['DateTimePicker', { value: '2025-03-20T18:00:00', maxDateTime: '2025-03-20' }],
    ['TimePicker', { value: '09:00', minTime: '09:00', maxTime: '17:00' }],
    ['DatePicker', { value: '' }],
  ])('in range stays valid: %s %j', async (name, props) => {
    const v = await mountValidated(name, props);
    await settle();
    expect(v.exposed.isValid).toBe(true);
  });
});

describe('MU-10 pickers: a date or time that does not exist is not read as another one', () => {
  test.each([
    ['DatePicker', '2025-13-45'],
    ['DatePicker', '2023-02-30'],
    ['DateTimePicker', '2025-13-45T10:00:00'],
    ['DateTimePicker', '2023-02-30T10:00:00'],
    ['DateTimePicker', '2025-03-14T25:00:00'],
    ['TimePicker', '25:99'],
    ['TimePicker', '12:75'],
  ])('%s value %s leaves the field empty', async (name, value) => {
    const v = await mountPack('mui', name, { value });
    await settle();
    expect(v.root().querySelector('input').value).toBe('');
    expect(v.exposed.value).toBe('');
  });

  test.each([
    ['DatePicker', '2025-03-14', '2026-13-45'],
    ['DatePicker', '2025-03-14', '2023-02-30'],
    ['DateTimePicker', '2025-03-14T10:00:00', '2026-13-45T10:00:00'],
    ['TimePicker', '10:00', '25:99'],
  ])(
    '%s setValue(%s → %s) empties the field, as text that is no date does, never another date',
    async (name, start, next) => {
      const v = await mountPack('mui', name, { value: start });
      await settle();
      await v.run('setValue', next);
      expect(v.exposed.value).toBe('');
      expect(v.root().querySelector('input').value).toBe('');
    }
  );

  test("TimePicker reads '1:45 PM' as 13:45", async () => {
    const v = await mountPack('mui', 'TimePicker', { value: '1:45 PM' });
    await settle();
    expect(v.exposed.value).toBe('13:45');
    expect(v.root().querySelector('input').value).toBe('01:45 PM');
  });
});

describe('MU-11 pickers: the exposed value is what the field shows', () => {
  test.each([
    ['DatePicker', '2025-03-14T10:30:00', '2025-03-14'],
    ['DatePicker', 'not a date', ''],
    ['DatePicker', '2025-03-14', '2025-03-14'],
    ['DateTimePicker', '2025-03-14', '2025-03-14T00:00:00'],
    ['DateTimePicker', '2025-03-14 13:45', '2025-03-14T13:45:00'],
    ['DateTimePicker', 'not a date', ''],
    ['TimePicker', '13:45:30', '13:45'],
    ['TimePicker', '9:05', '09:05'],
    ['TimePicker', 'not a time', ''],
  ])('%s value %s is exposed as %j', async (name, value, exposed) => {
    const v = await mountPack('mui', name, { value });
    await settle();
    expect(v.exposed.value).toBe(exposed);
  });

  test('normalising the bound value fires no change event', async () => {
    const v = await mountPack('mui', 'DatePicker', { value: '2025-03-14T10:30:00' });
    await settle();
    expect(v.events).not.toContain('onChange');
  });
});

describe('MU-12 / MU-34 Divider (layout checked in Chrome: jsdom draws nothing)', () => {
  test.each(['inset', 'middle'])('a horizontal %s line is not centred over its margins', async (variant) => {
    const v = await mountPack('mui', 'Divider', { variant });
    await settle();
    // .tj-mui-center > :only-child { margin-inline: auto } (pack.css) replaced MUI's Inset and Middle margins.
    expect(v.root().querySelector('.tj-mui-root').classList).toContain('tj-mui-start');
    expect(v.root().querySelector(`.MuiDivider-${variant}`)).not.toBeNull();
  });

  test('a long caption keeps its full text as the tooltip', async () => {
    const text = 'A deliberately long divider caption that would run past the right edge of the box';
    const v = await mountPack('mui', 'Divider', { children: text });
    await settle();
    expect(v.root().querySelector('.MuiDivider-root').getAttribute('title')).toBe(text);
  });
});

// isValid as the host publishes it, with a Validation section that fails with `message` when `fails(value)`.
const mountJudged = async (name, props, fails = () => false, message = 'Invalid') => {
  const published = {};
  const v = await mountPack('mui', name, props, {
    host: {
      useValidation: (value, present, rule) =>
        useHostValidation(
          {
            current: {
              validate: (x) => (fails(x) ? { isValid: false, validationError: message } : { isValid: true }),
              validation: {},
              setExposedVariable: (key, val) => (published[key] = val),
            },
          },
          value,
          present,
          rule
        ),
    },
  });
  v.published = published;
  return v;
};
const shownText = (v) => v.root().textContent;

describe('MU-15 Number Field: a value outside Min and Max that was not typed', () => {
  test.each([[{ min: 5, max: 10, value: 50 }], [{ min: 5, max: 10, value: 1 }]])('%j is invalid', async (props) => {
    const v = await mountJudged('NumberField', props);
    await settle();
    expect(v.published.isValid).toBe(false);
  });

  test('leaving the field still clamps the number to the range, which makes it valid', async () => {
    const v = await mountJudged('NumberField', { min: 5, max: 10, value: 50 });
    await settle();
    fireEvent.focusOut(v.root().querySelector('input'));
    await settle();
    expect(v.exposed.value).toBe(10);
    expect(v.published.isValid).toBe(true);
  });

  test.each([[99], [1]])('setValue(%p) with Min 5 and Max 10 is invalid', async (next) => {
    const v = await mountJudged('NumberField', { min: 5, max: 10, value: 7 });
    await settle();
    expect(v.published.isValid).toBe(true);
    await v.run('setValue', next);
    await settle();
    expect(v.published.isValid).toBe(false);
  });

  test.each([[5], [10], [null]])('%p within the range (or empty) stays valid', async (value) => {
    const v = await mountJudged('NumberField', { min: 5, max: 10, value });
    await settle();
    expect(v.published.isValid).toBe(true);
  });
});

describe('MU-18 Rating: a Precision that does not divide 1 evenly', () => {
  test.each([['0.3'], ['0.4'], ['0.7'], [0.3], ['-0.5'], ['0.0204']])(
    'precision %p still draws the rating',
    async (precision) => {
      const v = await mountPack('mui', 'Rating', { precision, value: 3 });
      await settle();
      expect(v.root().querySelectorAll('.MuiRating-root')).toHaveLength(1);
      expect(v.exposed.value).toBe(3);
    }
  );

  test.each([
    ['0.5', 2.5],
    ['0.25', 2.25],
    ['0.1', 2.3],
  ])('precision %p keeps its own steps', async (precision, value) => {
    const v = await mountPack('mui', 'Rating', { precision, value });
    await settle();
    expect(v.exposed.value).toBeCloseTo(value);
  });
});

describe('MU-21 an option whose value is empty (an All filter) is listed', () => {
  const OPTIONS = [
    { label: 'One', value: 1 },
    { label: 'All', value: '' },
  ];
  const optionEls = () =>
    [...document.body.querySelectorAll('*')]
      .flatMap((el) => [el, ...(el.shadowRoot ? el.shadowRoot.querySelectorAll('*') : [])])
      .filter((el) => el.getAttribute?.('role') === 'option');
  const menuLabels = () => optionEls().map((el) => el.textContent);

  test('Select lists it, and picking it shows All with the value empty', async () => {
    const v = await mountPack('mui', 'Select', { options: OPTIONS, value: 1 });
    await settle();
    fireEvent.mouseDown(v.root().querySelector('[role="combobox"]'));
    await settle();
    expect(menuLabels()).toEqual(['One', 'All']);
    fireEvent.click(optionEls().find((el) => el.textContent === 'All'));
    await settle();
    expect(v.exposed.value).toBe('');
    expect(v.exposed.selectedOption).toMatchObject({ label: 'All', value: '' });
    expect(v.root().querySelector('[role="combobox"]').textContent).toBe('All');
    expect(count(v, 'onChange')).toBe(1);
  });

  test('Select without such an option still reads an empty value as nothing picked', async () => {
    const v = await mountPack('mui', 'Select', { options: [{ label: 'One', value: 1 }], value: '' });
    await settle();
    expect(v.exposed.selectedOption).toEqual({});
    expect(v.root().textContent).toContain('Select');
  });

  test('Autocomplete and Autocomplete Multiple pick it by setValue', async () => {
    const one = await mountPack('mui', 'Autocomplete', { options: OPTIONS });
    await one.run('setValue', { label: 'All', value: '' });
    await settle();
    expect(one.exposed.value).toEqual({ label: 'All', value: '' });
    expect(one.root().querySelector('input').value).toBe('All');
    document.body.innerHTML = '';
    const many = await mountPack('mui', 'AutocompleteMultiple', { options: OPTIONS });
    await many.run('setValue', [1, { label: 'All', value: '' }]);
    await settle();
    expect(many.exposed.value).toEqual([
      { label: 'One', value: 1 },
      { label: 'All', value: '' },
    ]);
  });

  test('Autocomplete lists it when opened', async () => {
    const v = await mountPack('mui', 'Autocomplete', { options: OPTIONS });
    fireEvent.mouseDown(v.root().querySelector('input'));
    await settle();
    expect(menuLabels()).toEqual(['One', 'All']);
  });
});

describe('MU-22 Select: a Default value naming a numeric option', () => {
  const OPTIONS = [
    { label: 'One', value: 1 },
    { label: 'Two', value: 2 },
  ];
  test.each([['2'], [2]])('Default value %p exposes the number 2, with no On change', async (value) => {
    const v = await mountPack('mui', 'Select', { options: OPTIONS, value });
    await settle();
    expect(v.exposed.value).toBe(2);
    expect(v.exposed.selectedOption).toMatchObject({ label: 'Two', value: 2 });
    expect(count(v, 'onChange')).toBe(0);
  });

  test("an option '2' of its own is still picked by the text '2'", async () => {
    const v = await mountPack('mui', 'Select', {
      options: [...OPTIONS, { label: 'Text two', value: '2' }],
      value: '2',
    });
    await settle();
    expect(v.exposed.value).toBe('2');
    expect(v.exposed.selectedOption).toMatchObject({ label: 'Text two', value: '2' });
  });
});

describe('MU-23 / MU-24 a changed Slider or Switch shows its validation message', () => {
  test('Slider: moving the thumb below a custom rule shows the message', async () => {
    const v = await mountJudged('Slider', { value: 80 }, (x) => Number(x) < 60, 'at least 60');
    await settle();
    expect(shownText(v)).not.toContain('at least 60');
    fireEvent.change(v.root().querySelector('input[type="range"]'), { target: { value: 30 } });
    await settle();
    expect(v.exposed.value).toBe(30);
    expect(v.published.isValid).toBe(false);
    expect(shownText(v)).toContain('at least 60');
  });

  test('Switch: switching off a switch that must be on shows the message', async () => {
    const v = await mountJudged('Switch', { checked: false }, (x) => x !== true, 'must be on');
    await settle();
    const input = v.root().querySelector('input[type="checkbox"]');
    fireEvent.click(input);
    await settle();
    expect(shownText(v)).not.toContain('must be on');
    fireEvent.click(input);
    await settle();
    expect(v.published.isValid).toBe(false);
    expect(shownText(v)).toContain('must be on');
  });
});

describe('MU-39 / MU-41 a disabled Menu', () => {
  test('keeps its button look (the host dims the widget once) and says it is disabled', async () => {
    const v = await mountPack('mui', 'Menu', { variant: 'contained' }, { host: { disabled: true } });
    const button = v.root().querySelector('button');
    expect(button.classList.contains('Mui-disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(button);
    await settle();
    expect(v.exposed.isOpen).toBeFalsy();
    expect(count(v, 'onOpen')).toBe(0);
  });

  test('the Open action fires no On open', async () => {
    const v = await mountPack('mui', 'Menu', {}, { host: { disabled: true } });
    await v.run('open');
    await settle();
    expect(v.exposed.isOpen).toBeFalsy();
    expect(count(v, 'onOpen')).toBe(0);
  });

  test('an enabled Menu still opens from the action', async () => {
    const v = await mountPack('mui', 'Menu', {});
    await v.run('open');
    expect(v.exposed.isOpen).toBe(true);
    expect(count(v, 'onOpen')).toBe(1);
  });
});

describe('MU-40 Menu: clickedItem keeps the item value type', () => {
  const ITEMS = [
    { label: 'Num', value: 7 },
    { label: 'Text', value: 't' },
    { label: 'Yes', value: true },
  ];
  const pick = async (v, label) => {
    await v.run('open');
    await settle();
    const item = [...document.body.querySelectorAll('*')]
      .flatMap((el) => [el, ...(el.shadowRoot ? el.shadowRoot.querySelectorAll('*') : [])])
      .find((el) => el.getAttribute?.('role') === 'menuitem' && el.textContent === label);
    fireEvent.click(item);
    await settle();
  };
  test.each([
    ['Num', 7],
    ['Text', 't'],
    ['Yes', true],
  ])('%s exposes %p', async (label, value) => {
    const v = await mountPack('mui', 'Menu', { items: ITEMS });
    await pick(v, label);
    expect(v.exposed.clickedItem).toEqual({ label, value });
    expect(count(v, 'onItemClick')).toBe(1);
  });
});

describe('MU-42 Radio Group and Toggle Button Group: a Value naming a numeric option', () => {
  const OPTIONS = [
    { label: 'One', value: 1 },
    { label: 'Two', value: 2 },
  ];
  test.each([['RadioGroup'], ['ToggleButtonGroup']])(
    '%s exposes the number 2 for a Value of 2 or "2"',
    async (name) => {
      for (const value of [2, '2']) {
        const v = await mountPack('mui', name, { options: OPTIONS, value });
        await settle();
        expect(v.exposed.value).toBe(2);
        expect(count(v, 'onChange')).toBe(0);
        v.unmount();
      }
    }
  );

  test('Toggle Button Group, not exclusive: each value takes its option type', async () => {
    const v = await mountPack('mui', 'ToggleButtonGroup', { options: OPTIONS, exclusive: false, value: ['1', 2] });
    await settle();
    expect(v.exposed.value).toEqual([1, 2]);
  });

  test("Radio Group: an option '2' of its own is still picked by the text '2'", async () => {
    const v = await mountPack('mui', 'RadioGroup', {
      options: [...OPTIONS, { label: 'Text two', value: '2' }],
      value: '2',
    });
    await settle();
    expect(v.exposed.value).toBe('2');
  });
});

describe('MU-17 / MU-20 a long status chip in a list (layout checked in Chrome: jsdom draws nothing)', () => {
  const LONG = 'Waiting for the customer to confirm the delivery address and the signed contract';
  test.each([
    ['RecordList', { data: [{ id: 1, customer: 'Harbor Bistro', status: LONG, total: 1240 }] }],
    ['ProgressList', { data: [{ id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: LONG }] }],
  ])('%s caps the chip (MUI styles are not in jsdom) and shows its full text on hover', async (name, props) => {
    const v = await mountPack('mui', name, props);
    await settle();
    const chip = v.root().querySelector('.MuiChip-root');
    expect(chip.getAttribute('title')).toBe(LONG);
  });
});

describe('MU-35 Kanban: a card field holding an object', () => {
  test('is left out, not shown as [object Object] or OO', async () => {
    const v = await mountPack('mui', 'Kanban', {
      data: [{ id: 1, title: { a: 1 }, status: 'todo', priority: { b: 2 }, owner: { c: 3 }, note: ['x'] }],
      badgeField: 'priority',
      avatarField: 'owner',
      descriptionField: 'note',
    });
    await settle();
    const text = v.root().querySelector('.tj-mui-kb-card-title').closest('.MuiCard-root, .MuiPaper-root').textContent;
    expect(text).not.toContain('[object Object]');
    expect(text).not.toContain('OO');
    expect(v.root().querySelector('.tj-mui-kb-badge')).toBeNull();
    expect(v.root().querySelector('.tj-mui-kb-avatar')).toBeNull();
  });

  test('text, numbers and true/false still show', async () => {
    const v = await mountPack('mui', 'Kanban', {
      data: [{ id: 1, title: 'Write spec', status: 'todo', priority: 3, owner: 'Ann Lee' }],
      badgeField: 'priority',
      avatarField: 'owner',
    });
    await settle();
    expect(v.root().querySelector('.tj-mui-kb-card-title').textContent).toBe('Write spec');
    expect(v.root().querySelector('.tj-mui-kb-badge').textContent).toBe('3');
    expect(v.root().querySelector('.tj-mui-kb-avatar').textContent).toBe('AL');
  });
});

describe('MU-36 Key value: Empty value text bound to null', () => {
  const valueOf = (v) =>
    [...v.root().querySelectorAll('*')].filter((e) => !e.children.length).map((e) => e.textContent);
  // The host turns a null text property into '' (packPropertyTypes), so the component sees ''.
  test.each([[''], [null], [undefined]])('Empty value text %p shows the default dash', async (emptyText) => {
    const v = await mountPack('mui', 'KeyValue', { data: { Name: 'Ann', Phone: null }, emptyText });
    await settle();
    expect(valueOf(v)).toEqual(expect.arrayContaining(['Phone', '-']));
  });

  test('a text of its own is used', async () => {
    const v = await mountPack('mui', 'KeyValue', { data: { Phone: null }, emptyText: 'n/a' });
    await settle();
    expect(valueOf(v)).toContain('n/a');
  });
});

describe('MU-44 / MU-45 Stepper: Active step as an id, a label or with decimals', () => {
  const STEPS = [
    { id: 's1', label: 'One' },
    { id: 's2', label: 'Two' },
    { id: 's3', label: 'Three' },
  ];
  const active = (v) =>
    [...v.root().querySelectorAll('.MuiStepLabel-label')]
      .filter((e) => e.classList.contains('Mui-active'))
      .map((e) => e.textContent);

  test('the host keeps a step id or label given to Active step (a number property)', () => {
    const prop = { name: 'activeStep', type: 'number' };
    const types = acceptedTypes('mui', 'Stepper', prop);
    expect(toPropertyType('s2', types).value).toBe('s2');
    expect(toPropertyType('Two', types).value).toBe('Two');
    expect(toPropertyType(2, types).value).toBe(2);
  });

  test.each([['s2'], ['Two']])('Active step %p opens step Two', async (activeStep) => {
    const v = await mountPack('mui', 'Stepper', { steps: STEPS, activeStep });
    await settle();
    expect(active(v)).toEqual(['Two']);
  });

  test.each([
    [1.6, 'Review', 2],
    [1.2, 'Review', 1],
  ])('Active step %p highlights one step', async (activeStep, _label, index) => {
    const v = await mountPack('mui', 'Stepper', { activeStep });
    await settle();
    expect(active(v)).toHaveLength(1);
    expect(v.exposed.activeStep).toBe(index);
  });
});

describe('MU-46 Tabs: two tabs with the same value', () => {
  test('only the first is shown and selected, with one panel', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const v = await mountPack('mui', 'Tabs', {
      tabs: [
        { value: 'a', label: 'First' },
        { value: 'a', label: 'Second' },
        { value: 'b', label: 'Third' },
      ],
    });
    await settle();
    const tabs = [...v.root().querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.textContent)).toEqual(['First', 'Third']);
    expect(tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.textContent)).toEqual(['First']);
    expect([...v.root().querySelectorAll('[role="tabpanel"]')].filter((p) => !p.hidden)).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('more than one tab has the value "a"'));
    warn.mockRestore();
  });
});

describe('MU-19 lists bound to a query result object', () => {
  test.each([
    ['RecordList', 'data'],
    ['ProgressList', 'data'],
    ['CardGrid', 'dataSource'],
    ['Timeline', 'items'],
  ])('the host keeps an object given to %s.%s (an array property)', (component, name) => {
    const types = acceptedTypes('mui', component, { name, type: 'array' });
    const result = { rows: [{ id: 1, customer: 'Wrapped' }] };
    expect(toPropertyType(result, types).value).toBe(result);
    expect(toPropertyType([{ id: 1 }], types).value).toEqual([{ id: 1 }]);
  });

  test.each([
    ['RecordList', { data: { rows: [{ id: 1, customer: 'Wrapped' }] } }],
    ['ProgressList', { data: { rows: [{ id: 1, label: 'Wrapped', spent: 5, budget: 10 }] } }],
    ['CardGrid', { dataSource: { items: [{ id: 1, title: 'Wrapped' }] } }],
  ])('%s shows the records inside', async (name, props) => {
    const v = await mountPack('mui', name, props);
    await settle();
    expect(v.root().textContent).toContain('Wrapped');
  });
});

describe('MU-30 Card: Raised', () => {
  // MUI writes the elevation as a class (MuiPaper-elevationN); jsdom has no shadows to compare.
  const level = (v) =>
    [...v.root().querySelector('.MuiCard-root').classList].find((c) => /^MuiPaper-elevation\d+$/.test(c));
  test.each([
    [{ elevation: 1, raised: true }, 'MuiPaper-elevation8'],
    [{ elevation: 1, raised: false }, 'MuiPaper-elevation1'],
    [{ elevation: 12, raised: true }, 'MuiPaper-elevation12'],
  ])('%j draws %s', async (props, expected) => {
    const v = await mountPack('mui', 'Card', { variant: 'elevation', ...props });
    await settle();
    expect(level(v)).toBe(expected);
  });
});

describe('MU-37 / MU-38 Linear Progress', () => {
  test('a long label stays on one line, its full text on hover (layout checked in Chrome)', async () => {
    const label = 'This is a very long progress label that describes the upload of the quarterly reports file';
    const v = await mountPack('mui', 'LinearProgress', { label, value: 40 });
    await settle();
    const text = [...v.root().querySelectorAll('.MuiTypography-root')].find((e) => e.textContent === label);
    expect(text.classList.contains('MuiTypography-noWrap')).toBe(true);
    expect(text.getAttribute('title')).toBe(label);
  });

  // MUI draws the buffer bar shifted by (buffer - 100)%: 150 moved it half off the start of the track.
  const bufferShift = (v) => v.root().querySelectorAll('.MuiLinearProgress-bar')[1].style.transform;
  test.each([
    [150, 'translateX(0%)'],
    [100, 'translateX(0%)'],
    // Below the value (30) it is the value: nothing past the bar is buffered.
    [-5, 'translateX(-70%)'],
  ])('Value buffer %p is held between the value and 100', async (valueBuffer, transform) => {
    const v = await mountPack('mui', 'LinearProgress', { variant: 'buffer', value: 30, valueBuffer });
    await settle();
    expect(bufferShift(v)).toBe(transform);
  });
});

// Every match under the document, shadow roots included (the popup layer is in its own shadow root).
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};

describe('MU-25 Time Picker: Minutes step sets the minute list', () => {
  // A desktop pointer, so the picker opens its digital clock (the minute list) as in Chrome, not the mobile dial.
  beforeEach(() => {
    jest.spyOn(window, 'matchMedia').mockImplementation((media) => ({
      matches: /pointer:\s*fine/.test(media),
      media,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
  });
  afterEach(() => jest.restoreAllMocks());

  test.each([
    [15, ['00', '15', '30', '45']],
    [1, Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))],
  ])('step %p lists %j', async (minutesStep, expected) => {
    const v = await mountPack('mui', 'TimePicker', { minutesStep, value: '10:00' });
    await settle();
    fireEvent.click(v.root().querySelector('button[aria-label*="hoose"]'));
    await waitFor(() => expect(deepAll('[role="listbox"][aria-label="Select minutes"]')).toHaveLength(1));
    const minutes = deepAll('[role="listbox"][aria-label="Select minutes"] [role="option"]');
    expect(minutes.map((o) => o.textContent)).toEqual(expected);
  });
});

describe('MU-26 Timeline: a colour that is not one is ignored', () => {
  // jsdom gets no Emotion styles from the pack, so the dot colour the Timeline picks is checked here and drawn in Chrome.
  test.each([
    ['notacolor', undefined],
    ['', undefined],
    ['#ff00ff', '#ff00ff'],
    ['red', 'red'],
    ['#ff000080', '#ff000080'],
    ['success.main', 'success.main'],
  ])('an item colour %p reads as %p', (color, expected) => {
    expect(usableColor(color)).toBe(expected);
  });

  test("Colours by status { done: 'notacolor' } leaves done its own green", () => {
    expect(statusColor('done', { done: 'notacolor' })).toBe('success.main');
    expect(statusColor('done', { done: '#123456' })).toBe('#123456');
    expect(statusColor('shipped', { shipped: 'notacolor' })).toBeUndefined();
  });
});

describe('MU-29 Avatar: initials from letters only', () => {
  test.each([
    ['😀 Smile', 'S'],
    ['(Admin) Bob', 'AB'],
    ['<b>x</b> y', 'BY'],
    ['1st Place', '1P'],
  ])('%p gives %p', async (alt, expected) => {
    const v = await mountPack('mui', 'Avatar', { alt });
    await settle();
    expect(v.root().querySelector('.MuiAvatar-root').textContent).toBe(expected);
  });
});

describe('MU-32 pickers: Size small gets a small calendar/clock button', () => {
  test.each(['DatePicker', 'TimePicker', 'DateTimePicker'])('%s', async (name) => {
    const small = await mountPack('mui', name, {}, { styles: { variant: 'standard', size: 'small' } });
    await settle();
    const button = small.root().querySelector('button[aria-label*="hoose"]');
    expect(button.classList.contains('MuiIconButton-sizeSmall')).toBe(true);
    small.unmount();
    const medium = await mountPack('mui', name, {}, { styles: { variant: 'standard', size: 'medium' } });
    await settle();
    expect(
      medium.root().querySelector('button[aria-label*="hoose"]').classList.contains('MuiIconButton-sizeSmall')
    ).toBe(false);
  });
});

describe('MU-33 Dialog: an unknown Confirm colour or Max width falls back', () => {
  test("'zzz' for both draws a primary Confirm button in a sm dialog", async () => {
    const v = await mountPack('mui', 'Dialog', { confirmColor: 'zzz', maxWidth: 'zzz' });
    await settle();
    await v.run('open');
    await waitFor(() => expect(deepAll('.MuiDialog-paper')).toHaveLength(1));
    expect(deepAll('.MuiDialog-paper')[0].classList.contains('MuiDialog-paperWidthSm')).toBe(true);
    const confirm = deepAll('.MuiDialog-paper button').find((b) => b.textContent === 'Confirm');
    expect(confirm.classList.contains('MuiButton-colorPrimary')).toBe(true);
  });
});

describe('MU-16 Pie Chart: a legend taller than the box goes under the pie', () => {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  test('12 slices in a 451 by 300 box: under the pie, where it wraps into rows (Chrome: all 12 shown)', () => {
    expect(pieLegendPlace(451, 300, MONTHS)).toBe('bottom');
  });
  test('6 slices still fit at the side', () => {
    expect(pieLegendPlace(451, 300, MONTHS.slice(0, 6))).toBe('side');
  });
});

describe('MU-27 / MU-28 content wider or taller than the box scrolls (layout checked in Chrome)', () => {
  test('a Toggle Button Group without Full width scrolls its row sideways', async () => {
    const options = Array.from({ length: 10 }, (_, i) => ({ label: `Option ${i + 1}`, value: `o${i}` }));
    const v = await mountPack('mui', 'ToggleButtonGroup', { options });
    await settle();
    expect(v.root().querySelector('.tj-mui-loading').classList.contains('tj-mui-loading--scroll-x')).toBe(true);
    await v.update({ props: { options, fullWidth: true } });
    expect(v.root().querySelector('.tj-mui-loading').classList.contains('tj-mui-loading--scroll-x')).toBe(false);
  });

  test.each(['Typography', 'TypographyHeading'])('%s scrolls text taller than its box', async (name) => {
    const v = await mountPack('mui', name, { children: 'A long sentence. '.repeat(20) });
    await settle();
    const root = v.root().querySelector('.tj-mui-root');
    expect(root.classList.contains('tj-mui-scroll')).toBe(true);
    expect(root.classList.contains('tj-mui--fill')).toBe(true);
  });
});

describe('MU-14 / MU-43 Menu and Select menus inside a transformed popup layer (placement checked in Chrome)', () => {
  // ToolJet's popup layer is a containing block (its transform) 33px down the viewer; MUI places a Popover in window
  // coordinates, so its root is moved back by the layer's offset.
  const layer = (style) => {
    const host = document.createElement('div');
    Object.assign(host.style, style);
    host.getBoundingClientRect = () => ({ top: 33, left: 12, right: 0, bottom: 0, width: 0, height: 0 });
    const overlay = document.createElement('div');
    host.appendChild(overlay);
    document.body.appendChild(host);
    return overlay;
  };

  test('a layer with a transform is the origin a fixed popup is drawn from', () => {
    expect(fixedOrigin(layer({ transform: 'translateZ(0)' }))).toEqual({ top: 33, left: 12 });
  });

  test('without one, the window is', () => {
    expect(fixedOrigin(layer({}))).toEqual({ top: 0, left: 0 });
  });
});

describe('MU-13 Kanban: a custom card is moved with the mouse (the drag itself checked in Chrome)', () => {
  // A board in a shadow root with one card; the card's components are the host's, slotted in from the light DOM.
  const board = () => {
    const host = document.createElement('div');
    host.innerHTML = '<div slot="row"><span class="text">Alpha</span><input class="field" /></div>';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<div class="board"><div data-kb-col="todo"><div data-kb-card="c1" draggable="true">' +
      '<b class="own">own part</b><slot name="row"></slot></div></div><div data-kb-col="done"></div></div>';
    return { host, shadow, root: shadow.querySelector('.board') };
  };
  const pointer = (type, target, x, y, pointerType = 'mouse') => {
    const e = new MouseEvent(type, { bubbles: true, composed: true, clientX: x, clientY: y, button: 0 });
    Object.defineProperties(e, {
      pointerType: { value: pointerType },
      pointerId: { value: 1 },
      isPrimary: { value: true },
    });
    target.dispatchEvent(e);
  };
  const press = (target) => {
    const options = {
      current: { enabled: true, onPick: jest.fn(), onOver: jest.fn(), onDrop: jest.fn(), onCancel: jest.fn() },
    };
    const { root } = target;
    const { result } = renderHook(() => useTouchDragRef(options));
    result.current.current = root;
    return options.current;
  };

  test.each([
    ['its Text', (b) => b.host.querySelector('.text')],
    ['the row around it (the card corner)', (b) => b.host.querySelector('[slot="row"]')],
  ])('pressing %s and moving picks the card up and drops it', (_, at) => {
    const b = board();
    const o = press(b);
    pointer('pointerdown', at(b), 10, 10);
    pointer('pointermove', window, 30, 12);
    expect(o.onPick).toHaveBeenCalledWith('c1');
    pointer('pointerup', window, 30, 12);
    expect(o.onDrop).toHaveBeenCalledWith('c1');
  });

  test("the card's own parts keep the browser's HTML drag, and a field in the card is the field's", () => {
    const b = board();
    const o = press(b);
    pointer('pointerdown', b.shadow.querySelector('.own'), 10, 10);
    pointer('pointermove', window, 30, 12);
    pointer('pointerup', window, 30, 12);
    pointer('pointerdown', b.host.querySelector('.field'), 10, 10);
    pointer('pointermove', window, 30, 12);
    pointer('pointerup', window, 30, 12);
    expect(o.onPick).not.toHaveBeenCalled();
  });

  test('a small wobble is a click, not a drag', () => {
    const b = board();
    const o = press(b);
    pointer('pointerdown', b.host.querySelector('.text'), 10, 10);
    pointer('pointermove', window, 13, 12);
    pointer('pointerup', window, 13, 12);
    expect(o.onPick).not.toHaveBeenCalled();
  });

  test("over another custom card the drop finds that card's column", () => {
    const b = board();
    const light = b.host.querySelector('.text');
    const card = b.shadow.querySelector('[data-kb-card]');
    b.shadow.elementsFromPoint = () => [light, card, card.parentElement, b.root];
    const columns = [{ id: 'todo', cards: [{ __key: 'c1' }] }];
    card.getBoundingClientRect = () => ({ top: 0, height: 100 });
    expect(dropPointAt(b.root, columns, 5, 80)).toEqual({ columnId: 'todo', before: null });
  });
});
