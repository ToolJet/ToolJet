import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design ProgressList and RecordList QA queue (fix/ant-design-bugs-1.0). The pack's lists, the inline SDK and the
// host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant Design ProgressList: Ant status words', () => {
  // Break this catches: the bar's status comes only from the colour tone of the word, so Ant's own "exception" draws
  // the normal blue bar and "active" the plain success bar.
  test('[PackComponent-ANTLIST-001] "exception" draws the exception bar and "active" the active bar', async () => {
    const dataSource = [
      { label: 'Spend', value: 120, st: 'exception' },
      { label: 'Leads', value: 40, st: 'active' },
      { label: 'Done', value: 100, st: 'success' },
    ];
    const v = await mountPack('antd', 'ProgressList', { dataSource, statusField: 'st' });
    await settle();

    const bars = [...v.root().querySelectorAll('.ant-progress')];
    expect(bars[0].classList.contains('ant-progress-status-exception')).toBe(true);
    expect(bars[1].classList.contains('ant-progress-status-active')).toBe(true);
    expect(bars[2].classList.contains('ant-progress-status-success')).toBe(true);
  });
});

describe.each(['ProgressList', 'RecordList'])('Ant Design %s: Container background', (name) => {
  // Break this catches: Container background changes nothing on the list. A list without it keeps its own look.
  test(`[PackComponent-ANTLIST-002] ${name}: Container background colours the list, and only when set`, async () => {
    const styled = await mountPack('antd', name, {}, { styles: { colorBgContainer: '#ffeeaa' } });
    await settle();
    expect(styled.root().querySelector('.ant-list').classList.contains('tj-ant-list-bg')).toBe(true);
    document.body.innerHTML = '';

    const plain = await mountPack('antd', name, {});
    await settle();
    expect(plain.root().querySelector('.ant-list').classList.contains('tj-ant-list-bg')).toBe(false);
  });
});

describe.each(['ProgressList', 'RecordList'])('Ant Design %s: the keyboard', (name) => {
  // Break this catches: a row is not a Tab stop and Enter does nothing, so the keyboard cannot pick a row.
  test(`[PackComponent-ANTLIST-003] ${name}: a row is a Tab stop and Enter picks it, as a click does`, async () => {
    const v = await mountPack('antd', name, {});
    await settle();
    const rows = [...v.root().querySelectorAll('.ant-list-item')];
    expect(rows[1].getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(rows[1], { key: 'Enter' });
    await settle();

    expect(v.exposed.selectedItemIndex).toBe(1);
    expect(v.events).toContain('onItemClicked');
  });
});
