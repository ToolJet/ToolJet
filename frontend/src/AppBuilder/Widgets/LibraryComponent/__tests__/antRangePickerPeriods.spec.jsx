import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PKB-71): an Ant Design Range Picker with Picker month, quarter or year still showed full dates
// (2025-02-10 ~ 2025-04-20); the Ant Date Picker shows the period (2025-02). The pack component, the inline SDK and the
// host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// What the two fields show for a value and picker (Format left at its saved default).
const shown = async (picker, format = 'YYYY-MM-DD') => {
  const v = await mountPack('antd', 'RangePicker', { value: ['2025-02-10', '2025-04-20'], picker, format });
  return [...v.root().querySelectorAll('input')].map((input) => input.value);
};

describe('Ant Range Picker: a period picker shows the period', () => {
  test('[PackComponent-ANTRANGE-PERIOD-001] month shows months', async () => {
    expect(await shown('month')).toEqual(['2025-02', '2025-04']);
  });

  test('[PackComponent-ANTRANGE-PERIOD-002] quarter shows quarters', async () => {
    expect(await shown('quarter')).toEqual(['2025-Q1', '2025-Q2']);
  });

  test('[PackComponent-ANTRANGE-PERIOD-003] year shows years', async () => {
    expect(await shown('year')).toEqual(['2025', '2025']);
  });

  test('[PackComponent-ANTRANGE-PERIOD-004] control: date shows full dates', async () => {
    expect(await shown('date')).toEqual(['2025-02-10', '2025-04-20']);
  });

  test('[PackComponent-ANTRANGE-PERIOD-005] control: a Format the builder set is kept', async () => {
    expect(await shown('month', 'MMM YYYY')).toEqual(['Feb 2025', 'Apr 2025']);
  });

  test('[PackComponent-ANTRANGE-PERIOD-006] a month range is saved as the first day of each month', async () => {
    const v = await mountPack('antd', 'RangePicker', { value: [], picker: 'month', format: 'YYYY-MM-DD' });
    await v.run('setFieldValue', ['2025-02-10', '2025-04-20']);
    expect(v.exposed.value).toEqual(['2025-02-01', '2025-04-01']);
  });
});
