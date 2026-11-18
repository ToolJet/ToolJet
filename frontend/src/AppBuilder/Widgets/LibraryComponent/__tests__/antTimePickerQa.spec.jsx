import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Time Picker. The pack's TimePicker, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const shown = (v) => v.root().querySelector('.ant-picker input').value;

// PF-070: a Value with seconds (09:30:45) on the default HH:mm field showed an empty field, though the value was kept:
// it was read in the display format only, which has no seconds. It is read with or without seconds whatever the
// Format, and shown in the Format.
describe('Ant Design Time Picker: a value with seconds', () => {
  test.each([
    ['HH:mm', '09:30:45', '09:30'],
    ['HH:mm:ss', '09:30:45', '09:30:45'],
    ['HH:mm', '09:30', '09:30'],
    ['HH:mm:ss', '09:30', '09:30:00'],
  ])('[PackComponent-TIME-001] Format %s shows %s as %s', async (format, value, expected) => {
    const v = await mountPack('antd', 'TimePicker', { format, value });

    expect(shown(v)).toBe(expected);
  });

  test('[PackComponent-TIME-002] the value with seconds is kept as it was given', async () => {
    const v = await mountPack('antd', 'TimePicker', { format: 'HH:mm', value: '09:30:45' });

    expect(v.exposed.value).toBe('09:30:45');
  });
});
