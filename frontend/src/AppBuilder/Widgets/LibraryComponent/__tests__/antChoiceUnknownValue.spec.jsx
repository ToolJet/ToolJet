import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-57: an Ant Design TreeSelect, Cascader or Combobox given a value its options do not offer (zzz) showed the
// placeholder (the AD-35 fix) but still exposed zzz as its value, so a Form or a query read an option that is not on
// screen. The Select drops such a value once its options are there. The pack's components, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant Design TreeSelect, Cascader and Combobox: a value no option offers is not kept', () => {
  test('[PackComponent-UNKNOWNVALUE-001] TreeSelect zzz exposes no value, and fires nothing', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'zzz' });
    await settle();

    expect(v.exposed.value).toBe('');
    expect(v.events).toEqual([]);
  });

  test('[PackComponent-UNKNOWNVALUE-002] a multiple TreeSelect keeps only the values its tree offers', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: ['frontend', 'zzz'], multiple: true });
    await settle();

    expect(v.exposed.value).toEqual(['frontend']);
  });

  test('[PackComponent-UNKNOWNVALUE-003] Cascader [zzz] and [nope, x] expose no path', async () => {
    const one = await mountPack('antd', 'Cascader', { value: ['zzz'] });
    const two = await mountPack('antd', 'Cascader', { value: ['nope', 'x'] });
    await settle();

    expect(one.exposed.value).toEqual([]);
    expect(two.exposed.value).toEqual([]);
    expect([...one.events, ...two.events]).toEqual([]);
  });

  test('[PackComponent-UNKNOWNVALUE-004] Combobox zzz exposes no value and no selected option', async () => {
    const v = await mountPack('antd', 'Combobox', { value: 'zzz' });
    await settle();

    expect(v.exposed.value).toBe('');
    expect(v.exposed.selectedLabel).toBe('');
    expect(v.exposed.selectedOption).toEqual({});
    expect(v.events).toEqual([]);
  });

  // Characterization: values the options offer stay.
  test('[PackComponent-UNKNOWNVALUE-005] values the options offer are kept', async () => {
    const tree = await mountPack('antd', 'TreeSelect', { value: 'frontend' });
    const cascader = await mountPack('antd', 'Cascader', { value: ['europe', 'germany', 'berlin'] });
    const combobox = await mountPack('antd', 'Combobox', { value: 'berlin' });
    await settle();

    expect(tree.exposed.value).toBe('frontend');
    expect(cascader.exposed.value).toEqual(['europe', 'germany', 'berlin']);
    expect(combobox.exposed.value).toBe('berlin');
  });

  test('[PackComponent-UNKNOWNVALUE-006] while loading, a value waits for the options', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'zzz' }, { host: { loading: true } });
    await settle();
    expect(v.exposed.value).toBe('zzz');

    await v.update({ host: { ...makeHost('TreeSelect', {}), loading: false } });
    await settle();

    expect(v.exposed.value).toBe('');
  });

  // Characterization: with Filter option off a query fetches the options as the user searches, so they hold only the
  // last search's matches and a value picked from an earlier search is kept.
  test('[PackComponent-UNKNOWNVALUE-007] a Combobox searching on the server keeps its value', async () => {
    const v = await mountPack('antd', 'Combobox', { value: 'zzz', filterOption: false });
    await settle();

    expect(v.exposed.value).toBe('zzz');
  });
});
