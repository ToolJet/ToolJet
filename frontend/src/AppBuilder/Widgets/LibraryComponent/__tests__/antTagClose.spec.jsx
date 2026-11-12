import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA DVRL-13: an Ant Design Tag closed with its x could never be shown again (Ant hid it itself; hiding and showing the
// widget left it hidden) and nothing exposed that it was closed. The pack's Tag, Ant's Tag, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const tag = (v) => v.root().querySelector('.ant-tag');

describe('Ant Design Tag: closed with its x', () => {
  test('[PackComponent-TAGCLOSE-001] hides it, exposes closed and fires onClose once', async () => {
    const v = await mountPack('antd', 'Tag', { children: 'Beta', closable: true });
    await settle();
    expect(v.exposed.closed).toBe(false);

    act(() => {
      fireEvent.click(v.root().querySelector('.ant-tag-close-icon'));
    });
    await settle();

    expect(tag(v)).toBeNull();
    expect(v.exposed.closed).toBe(true);
    expect(v.events).toEqual(['onClose']);
  });

  test('[PackComponent-TAGCLOSE-002] the reopen action shows it again, with no event', async () => {
    const v = await mountPack('antd', 'Tag', { children: 'Beta', closable: true });
    await settle();
    act(() => {
      fireEvent.click(v.root().querySelector('.ant-tag-close-icon'));
    });
    await settle();

    await v.run('reopen');
    await settle();

    expect(tag(v)?.textContent).toBe('Beta');
    expect(v.exposed.closed).toBe(false);
    expect(v.events).toEqual(['onClose']);

    // And it closes again.
    act(() => {
      fireEvent.click(v.root().querySelector('.ant-tag-close-icon'));
    });
    await settle();
    expect(tag(v)).toBeNull();
    expect(v.events).toEqual(['onClose', 'onClose']);
  });
});
