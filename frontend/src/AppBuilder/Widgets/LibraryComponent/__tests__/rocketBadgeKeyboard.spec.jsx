import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: a Rocket 2.0 Badge with an On click event could not be reached with Tab, Enter did nothing, and assistive tech
// saw no role. The pack component, the inline SDK and the host renderer are the real ones; only module and CSS loading
// is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const badge = async () => {
  const v = await mountPack('shadcn', 'Badge', { text: 'New' });
  return { v, el: v.root().querySelector('.ui-badge') };
};
const clicks = (v) => v.events.filter((e) => String(e?.name ?? e) === 'onClick').length;

describe('Rocket Badge: reachable from the keyboard', () => {
  test('[PackComponent-BADGE-A11Y-001] the badge is a tab stop announced as a button named by its text', async () => {
    const { el } = await badge();
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.textContent).toBe('New');
  });

  test('[PackComponent-BADGE-A11Y-002] Enter and Space fire On click', async () => {
    const { v, el } = await badge();
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyDown(el, { key: ' ' });
    expect(clicks(v)).toBe(2);
  });

  test('[PackComponent-BADGE-A11Y-003] control: a mouse click fires On click once, other keys do not', async () => {
    const { v, el } = await badge();
    fireEvent.click(el);
    fireEvent.keyDown(el, { key: 'a' });
    expect(clicks(v)).toBe(1);
  });
});
