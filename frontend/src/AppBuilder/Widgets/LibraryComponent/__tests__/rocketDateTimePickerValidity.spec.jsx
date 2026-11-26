import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Date Time Picker showed its own message ('Pick a date on or before 20 Feb 2025', 'This date is not
// available') while isValid stayed true, so a Form still submitted; the Date Picker and Time Picker report it. The host
// makes isValid false for a component's own rule message (useHostValidation), so the picker must hand that message
// over. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The rule message the picker last handed the host's validation ('' or undefined when it passes).
const ruleFor = async (props) => {
  const rules = [];
  await mountPack('shadcn', 'DateTimePicker', props, {
    host: {
      useValidation: (value, present, rule) => {
        rules.push(rule);
        return { isValid: !rule, error: '', required: false, touch: () => {} };
      },
    },
  });
  return rules.at(-1);
};

describe('Rocket Date Time Picker: its own message makes isValid false', () => {
  test('[PackComponent-DTP-VALID-001] a value after Max date', async () => {
    expect(await ruleFor({ defaultValue: '2025-03-01T10:00', maxDate: '2025-02-20' })).toBe(
      'Pick a date on or before 20 Feb 2025'
    );
  });

  test('[PackComponent-DTP-VALID-002] a value before Min date', async () => {
    expect(await ruleFor({ defaultValue: '2025-01-01T10:00', minDate: '2025-02-10' })).toBe(
      'Pick a date on or after 10 Feb 2025'
    );
  });

  test('[PackComponent-DTP-VALID-003] a value on a disabled date', async () => {
    expect(await ruleFor({ defaultValue: '2025-03-01T10:00', disabledDates: ['2025-03-01'] })).toBe(
      'This date is not available'
    );
  });

  test('[PackComponent-DTP-VALID-004] control: a value inside the range hands over no message', async () => {
    expect(
      await ruleFor({ defaultValue: '2025-02-15T10:00', minDate: '2025-02-10', maxDate: '2025-02-20' })
    ).toBeFalsy();
  });
});
