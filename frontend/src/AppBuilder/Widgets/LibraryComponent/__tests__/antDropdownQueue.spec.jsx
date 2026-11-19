import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design Dropdown QA queue (fix/ant-design-bugs-1.0). The pack's Dropdown, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The menu opens in the pack's popup layer, inside a shadow root.
const findDeep = (selector, root = document) => {
  const hit = root.querySelector(selector);
  if (hit) return hit;
  for (const el of root.querySelectorAll('*')) {
    const inner = el.shadowRoot && findDeep(selector, el.shadowRoot);
    if (inner) return inner;
  }
  return null;
};

describe('Ant Design Dropdown: a wrong Placement value', () => {
  // Break this catches: an object bound to Placement reaches Ant, which calls placement.includes and throws, so the
  // widget is replaced by "Something went wrong". The host lets plain objects through to enumerations (MUI looks).
  test('[PackComponent-ANTDROPDOWN-001] an object Placement draws the button and opens the menu at the default place', async () => {
    const v = await mountPack('antd', 'Dropdown', { placement: { a: 1 } });
    await settle();

    const button = v.root().querySelector('.ant-btn');
    expect(button).not.toBeNull();
    fireEvent.click(button);
    await settle();

    expect(findDeep('.ant-dropdown-placement-bottomLeft')).not.toBeNull();
  });
});
