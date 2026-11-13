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

  // QA AD-57, reopened: the dropped value stayed dropped. With Value qa and options that do not offer it the field showed
  // the placeholder (as it should), but once the options were edited to offer qa the field still showed the placeholder
  // and exposed "", because the Value property itself never changed again. ToolJet's own Dropdown takes its default
  // again when its options change; here the value that was dropped comes back once an option offers it.
  test('[PackComponent-UNKNOWNVALUE-008] TreeSelect: a dropped value comes back when the tree offers it, firing nothing', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'qa' });
    await settle();
    expect(v.exposed.value).toBe('');

    await v.update({
      props: {
        value: 'qa',
        treeData: [
          { title: 'QA', value: 'qa' },
          { title: 'Ops', value: 'ops' },
        ],
      },
    });
    await settle();

    expect(v.exposed.value).toBe('qa');
    expect(v.events).toEqual([]);
  });

  test('[PackComponent-UNKNOWNVALUE-009] Cascader: a dropped path comes back when the options hold it', async () => {
    const v = await mountPack('antd', 'Cascader', { value: ['qa', 'lab'] });
    await settle();
    expect(v.exposed.value).toEqual([]);

    await v.update({
      props: {
        value: ['qa', 'lab'],
        options: [{ label: 'QA', value: 'qa', children: [{ label: 'Lab', value: 'lab' }] }],
      },
    });
    await settle();

    expect(v.exposed.value).toEqual(['qa', 'lab']);
    expect(v.events).toEqual([]);
  });

  test('[PackComponent-UNKNOWNVALUE-010] Combobox: a dropped value comes back with its label', async () => {
    const v = await mountPack('antd', 'Combobox', { value: 'qa' });
    await settle();
    expect(v.exposed.value).toBe('');

    await v.update({ props: { value: 'qa', options: [{ label: 'QA team', value: 'qa' }] } });
    await settle();

    expect(v.exposed.value).toBe('qa');
    expect(v.exposed.selectedLabel).toBe('QA team');
    expect(v.events).toEqual([]);
  });

  // Characterization: what was set after the value was dropped stays; the dropped value does not overwrite it.
  test('[PackComponent-UNKNOWNVALUE-011] a value set after the drop is kept when the options change', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'qa' });
    await settle();
    await v.run('setFieldValue', 'frontend');
    expect(v.exposed.value).toBe('frontend');

    const tree = [
      { title: 'QA', value: 'qa' },
      { title: 'Frontend', value: 'frontend' },
    ];
    await v.update({ props: { value: 'qa', treeData: tree } });
    await settle();

    expect(v.exposed.value).toBe('frontend');
  });
});
