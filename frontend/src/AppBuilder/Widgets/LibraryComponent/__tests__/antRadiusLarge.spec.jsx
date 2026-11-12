import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA AD-45: on an Ant Design Card, Collapse, List, Transfer list and Upload drag area, Border radius 0 left 2px round
// corners and 20 drew 22px: the pack set antd's large radius, which those containers draw, to the value plus 2. The
// pack's components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced,
// so the check is the radius token the component's root gives antd.css (--tj-ant-border-radius-lg).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const radii = (v) => {
  const root = v.root().querySelector('.tj-ant-root');
  return ['--tj-ant-border-radius', '--tj-ant-border-radius-lg'].map((name) =>
    root.style.getPropertyValue(name).trim()
  );
};

describe('Ant Design Border radius: the large radius is the value set', () => {
  test.each(['Card', 'Collapse', 'List'])(
    '[PackComponent-RADIUS-001] %s: Border radius 0 and 20 give radii of 0px and 20px, large ones too',
    async (name) => {
      const square = await mountPack('antd', name, {}, { styles: { borderRadius: 0 } });
      const round = await mountPack('antd', name, {}, { styles: { borderRadius: 20 } });

      expect(radii(square)).toEqual(['0px', '0px']);
      expect(radii(round)).toEqual(['20px', '20px']);
    }
  );
});
