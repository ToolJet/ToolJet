import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

installBrowserStubs();

// QA: a Rocket 2.0 Schedule with Day starts at 09:30 and Day ends at 12:00 drew the default 8 AM to 5 PM columns; a
// plain hour (9) worked. The Schedule reads a clock time, but the host turned the text into a number before the
// Schedule saw it, and '09:30' is not one. The pack component, the inline SDK and the host renderer are the real ones;
// only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const MANIFEST = [
  { name: 'dayStart', type: 'number' },
  { name: 'dayEnd', type: 'number' },
];
// The hour columns, with Day starts at and Day ends at as the host hands them to the Schedule.
const columns = async (dayStart, dayEnd) => {
  const { props } = typedPackProps('shadcn', 'Schedule', MANIFEST, { dayStart, dayEnd });
  const v = await mountPack('shadcn', 'Schedule', { ...props, scale: 'hours' });
  return [...v.root().querySelectorAll('.ucs-col-label')].map((el) => el.textContent);
};

describe('Rocket Schedule: Day starts at and Day ends at as clock times', () => {
  test('[PackComponent-SCHED-DAY-001] 09:30 to 12:00 draws 9 AM, 10 AM, 11 AM', async () => {
    expect(await columns('09:30', '12:00')).toEqual(['9 AM', '10 AM', '11 AM']);
  });

  test('[PackComponent-SCHED-DAY-002] 9 AM to 5:30 PM draws 9 AM to 5 PM', async () => {
    const labels = await columns('9 AM', '5:30 PM');
    expect(labels[0]).toBe('9 AM');
    expect(labels[labels.length - 1]).toBe('5 PM');
  });

  test('[PackComponent-SCHED-DAY-003] controls: the hour 9 and the text 9 both start at 9 AM', async () => {
    expect((await columns(9, 12))[0]).toBe('9 AM');
    expect((await columns('9', '12'))[0]).toBe('9 AM');
  });

  test('[PackComponent-SCHED-DAY-004] text that is not a time keeps the default 8 AM start', async () => {
    expect((await columns('soon', 12))[0]).toBe('8 AM');
  });
});
