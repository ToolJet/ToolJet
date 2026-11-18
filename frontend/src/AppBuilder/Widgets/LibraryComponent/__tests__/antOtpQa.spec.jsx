import { fireEvent, waitFor } from '@testing-library/react';
import { useHostValidation } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design OTP. The pack's OTP, the inline SDK, the host renderer and the host's
// validation (useHostValidation) are the real ones; only module and CSS loading is replaced, and the widget's
// Validation section is stood in for by its verdict (Required: empty is invalid).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const mountOtp = async (props, { required = false } = {}) => {
  const published = {};
  const latest = {
    current: {
      validate: (value) =>
        required && value === undefined
          ? { isValid: false, validationError: 'Field cannot be empty' }
          : { isValid: true },
      validation: { mandatory: required },
      setExposedVariable: (key, value) => {
        published[key] = value;
      },
    },
  };
  const v = await mountPack(
    'antd',
    'OTP',
    { length: 6, ...props },
    {
      host: { useValidation: (value, present, rule) => useHostValidation(latest, value, present, rule) },
    }
  );
  return { ...v, published };
};
const boxes = (v) => [...v.root().querySelectorAll('.ant-otp input')];

// AD-21: with Required on, a half-filled code (12 of 6) was valid, so a Form submitted it. Required only asked for a
// value. A code shorter than its Length is now not valid, required or not ('Enter all 6 characters', as the Rocket 2.0
// OTP says); an empty code is valid unless Required.
describe('Ant Design OTP: a half-filled code', () => {
  test('[PackComponent-OTP-001] a required half-filled code is not valid and says how many characters', async () => {
    const v = await mountOtp({ value: '12' }, { required: true });

    await waitFor(() => expect(v.published.isValid).toBe(false));
    fireEvent.blur(boxes(v)[1]);
    await waitFor(() => expect(v.root().textContent).toContain('Enter all 6 characters'));
  });

  test('[PackComponent-OTP-002] a half-filled code is not valid without Required either', async () => {
    const v = await mountOtp({ value: '12' });

    await waitFor(() => expect(v.published.isValid).toBe(false));
  });

  test('[PackComponent-OTP-003] a full code is valid; an empty one is valid unless Required', async () => {
    const full = await mountOtp({ value: '123456' }, { required: true });
    const empty = await mountOtp({ value: '' });
    const emptyRequired = await mountOtp({ value: '' }, { required: true });

    await waitFor(() => expect(full.published.isValid).toBe(true));
    await waitFor(() => expect(empty.published.isValid).toBe(true));
    await waitFor(() => expect(emptyRequired.published.isValid).toBe(false));
  });
});

// PF-063: an Ant field showing its validation message did not set aria-invalid, so a screen reader was not told it is
// invalid (a ToolJet Text Input in the same state sets aria-invalid="true"). Every Ant field draws its message through
// the pack's FormField: while the message shows, the field's own inputs are marked aria-invalid="true"; once the value
// is valid again, they are not.
describe('Ant Design fields showing a validation message', () => {
  const marked = (v) =>
    [...v.root().querySelectorAll('.ant-form-item-control-input input')].map((i) => i.getAttribute('aria-invalid'));

  test('[PackComponent-OTP-004] a required OTP left empty marks every box aria-invalid', async () => {
    const v = await mountOtp({ value: '' }, { required: true });
    fireEvent.blur(boxes(v)[0]);

    await waitFor(() => expect(v.root().textContent).toContain('Field cannot be empty'));
    expect(marked(v)).toEqual(Array(6).fill('true'));
  });

  test('[PackComponent-OTP-005] the boxes are not marked once the code is valid', async () => {
    const v = await mountOtp({ value: '12' }, { required: true });
    fireEvent.blur(boxes(v)[0]);
    await waitFor(() => expect(marked(v)).toEqual(Array(6).fill('true')));

    await v.update({ props: { length: 6, value: '123456' } });

    await waitFor(() => expect(marked(v)).toEqual(Array(6).fill(null)));
  });

  test('[PackComponent-FIELD-001] an Input showing its message is aria-invalid too', async () => {
    const published = {};
    const latest = {
      current: {
        validate: (value) =>
          value === undefined ? { isValid: false, validationError: 'Field cannot be empty' } : { isValid: true },
        validation: { mandatory: true },
        setExposedVariable: (key, value) => {
          published[key] = value;
        },
      },
    };
    const v = await mountPack(
      'antd',
      'Input',
      { value: '' },
      {
        host: { useValidation: (value, present, rule) => useHostValidation(latest, value, present, rule) },
      }
    );
    fireEvent.blur(v.root().querySelector('input'));

    await waitFor(() => expect(v.root().textContent).toContain('Field cannot be empty'));
    expect(v.root().querySelector('input').getAttribute('aria-invalid')).toBe('true');
  });
});
