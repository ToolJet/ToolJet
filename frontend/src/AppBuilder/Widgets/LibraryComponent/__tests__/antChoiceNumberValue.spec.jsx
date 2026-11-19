import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));
afterEach(() => {
  document.body.innerHTML = '';
});

// PF-271: the host hands a bound number to the pack as text ('2'); the exposed value must be the option's own value.
const nums = [
  { label: 'One', value: 1 },
  { label: 'Two', value: 2 },
];
const texts = [
  { label: 'One', value: '1' },
  { label: 'Two', value: '2' },
];

describe.each(['RadioGroup', 'Combobox'])('%s', (name) => {
  test('host text "2" with number options exposes the number 2, no event', async () => {
    const v = await mountPack('antd', name, { options: nums, value: '2' });
    await settle();
    expect(v.exposed.value).toBe(2);
    expect(v.events).toEqual([]);
  });
  test('host text "2" with text options stays "2"', async () => {
    const v = await mountPack('antd', name, { options: texts, value: '2' });
    await settle();
    expect(v.exposed.value).toBe('2');
    expect(v.events).toEqual([]);
  });
});

test('RadioGroup: a value no option offers is cleared', async () => {
  const v = await mountPack('antd', 'RadioGroup', { options: nums, value: '9' });
  await settle();
  expect(v.exposed.value).toBe('');
});
