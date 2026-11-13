import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Material UI Autocomplete's value is MUI's shape, the picked option { label, value }, however it got there: a bound
// bare value ('berlin') held the bare value until the first pick or setValue, which then wrote objects, so an app
// reading value saw two shapes.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const OPTIONS = [
  { label: 'Berlin', value: 'berlin' },
  { label: 'Sydney', value: 'sydney' },
  { label: 'Toronto', value: 'toronto' },
];
const BERLIN = { label: 'Berlin', value: 'berlin' };
const SYDNEY = { label: 'Sydney', value: 'sydney' };

describe('AutocompleteMultiple value', () => {
  test('a bound list of bare values reads as the picked options, as setValue leaves it', async () => {
    const bound = await mountPack('mui', 'AutocompleteMultiple', { options: OPTIONS, value: ['berlin', 'sydney'] });
    const set = await mountPack('mui', 'AutocompleteMultiple', { options: OPTIONS, value: [] });
    await set.run('setValue', ['berlin', 'sydney']);
    await settle();
    expect(set.exposed.value).toEqual([BERLIN, SYDNEY]);
    expect(bound.exposed.value).toEqual(set.exposed.value);
  });

  test('normalising a bound value fires no change event', async () => {
    const v = await mountPack('mui', 'AutocompleteMultiple', { options: OPTIONS, value: ['berlin'] });
    await settle();
    expect(v.events).not.toContain('onChange');
  });

  test('a bound value no option offers yet is kept for when the options arrive', async () => {
    const v = await mountPack('mui', 'AutocompleteMultiple', { options: [], value: ['berlin'] });
    await settle();
    expect(v.exposed.value).toEqual(['berlin']);
    await v.update({ props: { options: OPTIONS, value: ['berlin'] } });
    await settle();
    expect(v.exposed.value).toEqual([BERLIN]);
  });
});

describe('Autocomplete value', () => {
  test('a bound bare value reads as the picked option, as setValue leaves it', async () => {
    const bound = await mountPack('mui', 'Autocomplete', { options: OPTIONS, value: 'berlin' });
    const set = await mountPack('mui', 'Autocomplete', { options: OPTIONS, value: null });
    await set.run('setValue', 'berlin');
    await settle();
    expect(set.exposed.value).toEqual(BERLIN);
    expect(bound.exposed.value).toEqual(BERLIN);
    expect(bound.events).not.toContain('onChange');
  });
});
