import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (AD-10): an Ant Design Color Picker with Value red showed Transparent; the native Color picker shows red. The browser
// names a CSS colour through a canvas (fillStyle reads back #ff0000), which jsdom lacks, so a canvas that knows the
// names used here stands in for it. The pack component, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const NAMES = { red: '#ff0000', rebeccapurple: '#663399' };
const realGetContext = HTMLCanvasElement.prototype.getContext;
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = function () {
    let style = '#000000';
    return {
      get fillStyle() {
        return style;
      },
      // A browser keeps the last valid colour when it is given one it cannot read.
      set fillStyle(v) {
        const text = String(v).trim().toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(text)) style = text;
        else if (NAMES[text]) style = NAMES[text];
      },
    };
  };
});
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  document.body.innerHTML = '';
});

describe('Ant Color Picker: a colour name is that colour', () => {
  test('[PackComponent-ANTCOLOR-NAME-001] Value red exposes #ff0000', async () => {
    const v = await mountPack('antd', 'ColorPicker', { value: 'red' });
    expect(v.exposed.value).toBe('#ff0000');
  });

  test('[PackComponent-ANTCOLOR-NAME-002] setFieldValue rebeccapurple sets #663399', async () => {
    const v = await mountPack('antd', 'ColorPicker', { value: '#000000' });
    await v.run('setFieldValue', 'rebeccapurple');
    expect(v.exposed.value).toBe('#663399');
  });

  test('[PackComponent-ANTCOLOR-NAME-003] control: text that is not a colour is still ignored', async () => {
    const v = await mountPack('antd', 'ColorPicker', { value: '#010203' });
    await v.run('setFieldValue', 'notacolor');
    expect(v.exposed.value).toBe('#010203');
  });

  test('[PackComponent-ANTCOLOR-NAME-004] control: short hex still works', async () => {
    const v = await mountPack('antd', 'ColorPicker', { value: '#f00' });
    expect(v.exposed.value).toBe('#f00');
  });
});
