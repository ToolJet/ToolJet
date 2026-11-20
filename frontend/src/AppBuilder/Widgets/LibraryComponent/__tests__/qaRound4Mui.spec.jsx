import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA round four, Material UI pack. The pack components, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
];

describe('value shapes', () => {
  test('ToggleButtonGroup: setValue takes a value of the other shape in this one', async () => {
    const v = await mountPack('mui', 'ToggleButtonGroup', { options: OPTIONS, exclusive: true, value: 'day' });
    await v.run('setValue', ['week', 'day']);
    expect(v.exposed.value).toBe('week');
    const m = await mountPack('mui', 'ToggleButtonGroup', { options: OPTIONS, exclusive: false, value: [] });
    await m.run('setValue', 'week');
    expect(m.exposed.value).toEqual(['week']);
  });

  test('ToggleButtonGroup: turning Exclusive off keeps the selection, as a list', async () => {
    const v = await mountPack('mui', 'ToggleButtonGroup', { options: OPTIONS, exclusive: true, value: 'week' });
    await v.update({ props: { options: OPTIONS, exclusive: false, value: 'week' } });
    expect(v.exposed.value).toEqual(['week']);
    const pressed = [...v.root().querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed'));
    expect(pressed).toEqual(['false', 'true']);
  });

  test('AutocompleteMultiple: setValue with one value picks that option', async () => {
    const v = await mountPack('mui', 'AutocompleteMultiple', { options: OPTIONS, value: [] });
    await v.run('setValue', 'week');
    expect(v.exposed.value.map((o) => (typeof o === 'object' ? o.value : o))).toEqual(['week']);
  });

  test.each(['RadioGroup', 'Select'])('%s: a value no option offers is dropped', async (name) => {
    const v = await mountPack('mui', name, { options: OPTIONS, value: 'year' });
    await settle();
    expect(v.exposed.value).toBe('');
  });

  test('Slider: a configured range survives Range arriving after the first render', async () => {
    const v = await mountPack('mui', 'Slider', { range: false, value: [20, 80] });
    await v.update({ props: { range: true, value: [20, 80] } });
    await settle();
    expect(v.exposed.value).toEqual([20, 80]);
  });
});

describe('DataGrid', () => {
  test('rows with a repeated id or none each keep their own row', async () => {
    const rows = [{ id: 2, name: 'Two' }, { id: 7, name: 'Seven' }, { id: 7, name: 'Seven again' }, { name: 'No id' }];
    const v = await mountPack('mui', 'DataGrid', { rows });
    await v.run('selectRow', 7);
    expect(v.exposed.selectedRow.name).toBe('Seven');
    await v.run('selectRow', '7~1');
    expect(v.exposed.selectedRow.name).toBe('Seven again');
    await v.run('selectRow', '~3');
    expect(v.exposed.selectedRow.name).toBe('No id');
    await v.run('selectRow', 2);
    expect(v.exposed.selectedRow.name).toBe('Two');
  });
});

test('number formats: percent reads a fraction', () => {
  const { formatNumber } = require('../../../../../../packs/mui/src/lib/format.ts');
  expect(formatNumber(0.25, 'percent')).toBe('25%');
});
