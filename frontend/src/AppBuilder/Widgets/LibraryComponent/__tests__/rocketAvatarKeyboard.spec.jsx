import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Avatar with an On click event could not be reached with Tab, Enter did nothing, and assistive tech
// saw no role or name. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const avatar = async (props) => {
  const v = await mountPack('shadcn', 'Avatar', props);
  return { v, el: v.root().querySelector('.ui2-avatar-row') };
};
const clicks = (v) => v.events.filter((e) => String(e?.name ?? e) === 'onClick').length;

describe('Rocket Avatar: reachable from the keyboard', () => {
  test('[PackComponent-AVATAR-A11Y-001] the avatar is a tab stop announced as a button named by the person', async () => {
    const { el } = await avatar({ names: 'Ada Lovelace' });
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute('aria-label')).toBe('Ada Lovelace');
  });

  test('[PackComponent-AVATAR-A11Y-002] a group is named by the people shown and how many more', async () => {
    const { el } = await avatar({ names: 'Ada Lovelace, Grace Hopper, Alan Turing', maxVisible: 2 });
    expect(el.getAttribute('aria-label')).toBe('Ada Lovelace, Grace Hopper and 1 more');
  });

  test('[PackComponent-AVATAR-A11Y-003] Enter and Space fire On click', async () => {
    const { v, el } = await avatar({ names: 'Ada Lovelace' });
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyDown(el, { key: ' ' });
    expect(clicks(v)).toBe(2);
  });

  test('[PackComponent-AVATAR-A11Y-004] control: a mouse click fires On click once, other keys do not', async () => {
    const { v, el } = await avatar({ names: 'Ada Lovelace' });
    fireEvent.click(el);
    fireEvent.keyDown(el, { key: 'a' });
    expect(clicks(v)).toBe(1);
  });
});
