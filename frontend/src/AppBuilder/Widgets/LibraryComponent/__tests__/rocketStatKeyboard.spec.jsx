import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-266): a Rocket 2.0 Stat with an On click event could not be reached with Tab, Enter did nothing, and assistive
// tech saw no role. As the Badge and Avatar, it is a tab stop announced as a button named by what it shows. The pack
// component, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const stat = async () => {
  const v = await mountPack('shadcn', 'Stat', { label: 'Revenue', value: '1250' });
  return { v, el: v.root().querySelector('.ui-stat') };
};
const clicks = (v) => v.events.filter((e) => String(e?.name ?? e) === 'onClick').length;

describe('Rocket Stat: reachable from the keyboard', () => {
  test('[PackComponent-STAT-A11Y-001] the stat is a tab stop announced as a button', async () => {
    const { el } = await stat();
    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);
    expect(el.textContent).toContain('Revenue');
  });

  test('[PackComponent-STAT-A11Y-002] Enter and Space fire On click', async () => {
    const { v, el } = await stat();
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyDown(el, { key: ' ' });
    expect(clicks(v)).toBe(2);
  });

  test('[PackComponent-STAT-A11Y-003] control: a mouse click fires On click once, other keys do not', async () => {
    const { v, el } = await stat();
    fireEvent.click(el);
    fireEvent.keyDown(el, { key: 'a' });
    expect(clicks(v)).toBe(1);
  });
});
