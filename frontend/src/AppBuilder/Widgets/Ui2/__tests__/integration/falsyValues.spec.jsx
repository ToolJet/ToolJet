/**
 * UI 2.0 inputs and pickers: 0, false and an option valued '' are values.
 *
 * Review (2026-10-17): a required Yes/No Select exposed false for "No" but reported isValid false, because ToolJet's
 * validation engine judges mandatory as `!value`. Every input and picker must tell "nothing picked" from a picked or
 * typed falsy value, in what it exposes and in its required check. A Checkbox is the one where false means not
 * filled (a mandatory checkbox must be checked), and a Rating of 0 stars is no rating.
 *
 * Each case sets the value with the widget's own action (published before it resolves) and reads what an app sees.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const FALSY_OPTIONS =
  "{{[{ label: 'No', value: false }, { label: 'Zero', value: 0 }, { label: 'All', value: '' }, { label: 'Yes', value: true }]}}";
const REQUIRED = { mandatory: '{{true}}' };

// [componentType, properties, validation, steps: [action, args, exposed after]]
const CASES = [
  [
    'ShadSelect',
    { options: FALSY_OPTIONS },
    REQUIRED,
    [
      ['selectOption', [false], { value: false, isValid: true }],
      ['selectOption', [0], { value: 0, isValid: true }],
      ['selectOption', [''], { value: '', isValid: true }],
      ['clear', [], { value: '', isValid: false }],
    ],
  ],
  [
    'ShadCombobox',
    { options: FALSY_OPTIONS },
    REQUIRED,
    [
      ['selectOption', [false], { value: false, isValid: true }],
      ['selectOption', [0], { value: 0, isValid: true }],
      ['clear', [], { value: '', isValid: false }],
    ],
  ],
  [
    'ShadMultiselect',
    { options: FALSY_OPTIONS, defaultValue: '{{[]}}' },
    REQUIRED,
    [
      ['selectOptions', [[false]], { values: [false], isValid: true }],
      ['selectOptions', [[0]], { values: [false, 0], isValid: true }],
      ['clear', [], { values: [], isValid: false }],
    ],
  ],
  [
    'ShadRadioGroup',
    { options: FALSY_OPTIONS, defaultValue: '' },
    REQUIRED,
    [
      ['selectOption', [false], { value: false, isValid: true }],
      ['selectOption', [0], { value: 0, isValid: true }],
      ['deselectOption', [], { isValid: false }],
    ],
  ],
  [
    'ShadButtonGroup',
    { buttons: FALSY_OPTIONS, defaultValue: '' },
    REQUIRED,
    [
      ['setSelected', [false], { value: false, isValid: true }],
      ['setSelected', [0], { value: 0, isValid: true }],
      ['clear', [], { isValid: false }],
    ],
  ],
  [
    'ShadToggleGroup',
    { options: FALSY_OPTIONS, defaultValue: '' },
    {},
    [
      ['setSelected', [false], { value: false }],
      ['setSelected', [0], { value: 0 }],
    ],
  ],
  [
    'ShadNumberInput',
    { defaultValue: '' },
    REQUIRED,
    [
      ['setText', [0], { value: 0, isValid: true }],
      ['clear', [], { value: null, isValid: false }],
    ],
  ],
  [
    'ShadCurrencyInput',
    { defaultValue: '' },
    REQUIRED,
    [
      ['setValue', [0], { value: 0, isValid: true }],
      ['clear', [], { value: null, isValid: false }],
    ],
  ],
  ['ShadSlider', { min: '{{0}}', max: '{{10}}', defaultValue: '{{5}}' }, {}, [['setValue', [0], { value: 0 }]]],
  [
    'ShadRating',
    { defaultValue: '{{0}}' },
    REQUIRED,
    [
      ['setValue', [1], { value: 1, isValid: true }],
      ['setValue', [0], { value: 0, isValid: false }],
    ],
  ],
  [
    'ShadCheckbox',
    {},
    REQUIRED,
    [
      ['setValue', [true], { value: true, isValid: true }],
      ['setValue', [false], { value: false, isValid: false }],
    ],
  ],
  ['ShadSwitch', {}, {}, [['setValue', [false], { value: false }]]],
  [
    'ShadTagsInput',
    { defaultValue: '{{[]}}' },
    REQUIRED,
    [
      ['setTags', [['0']], { values: ['0'], isValid: true }],
      ['clear', [], { values: [], isValid: false }],
    ],
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([componentType]) => [
    componentType,
    createWidgetHarness({
      componentType,
      handle: 'widget1',
      id: ID,
      widgetHeight: 200,
      widgetWidth: 420,
      preload: [componentType],
    }),
  ])
);

describe('UI 2.0 inputs treat 0, false and an option valued "" as values', () => {
  it.each(CASES)('%s', async (componentType, properties, validation, steps) => {
    const widget = harnesses[componentType];
    await widget.setup();
    try {
      const bind = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, binding(v)]));
      widget.render({ currentMode: 'view', properties: bind(properties), validation: bind(validation) });
      for (const [action, args, expected] of steps) {
        expect([action, args, await widget.actNow(action, ...args)]).toEqual([
          action,
          args,
          expect.objectContaining(expected),
        ]);
      }
    } finally {
      widget.teardown();
    }
  });
});
