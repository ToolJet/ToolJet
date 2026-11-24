import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-088): setFieldValue('rgb(1, 2, 3)') on an Ant Design Color Picker whose Format is hex showed #010203 but kept
// exposing the text 'rgb(1, 2, 3)'; the native Color picker exposes the colour in fixed forms whatever text it is
// given. The browser reads a CSS colour through a canvas (fillStyle reads back #010203), which jsdom lacks, so a canvas
// that reads the colours used here stands in for it. The pack component, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const READS = { 'rgb(1, 2, 3)': '#010203', 'hsl(0, 100%, 50%)': '#ff0000' };
const realGetContext = HTMLCanvasElement.prototype.getContext;
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = function () {
    let style = '#000000';
    return {
      get fillStyle() {
        return style;
      },
      set fillStyle(v) {
        const text = String(v).trim().toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(text)) style = text;
        else if (READS[text]) style = READS[text];
      },
    };
  };
});
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext;
  document.body.innerHTML = '';
});

const setTo = async (format, start, next) => {
  const v = await mountPack('antd', 'ColorPicker', { value: start, format });
  await v.run('setFieldValue', next);
  return v.exposed.value;
};

describe("Ant Color Picker: setFieldValue exposes the colour in the field's format", () => {
  test('[PackComponent-ANTCOLOR-FMT-001] rgb text on a hex field exposes hex', async () => {
    expect(await setTo('hex', '#000000', 'rgb(1, 2, 3)')).toBe('#010203');
  });

  test('[PackComponent-ANTCOLOR-FMT-002] hsl text on a hex field exposes hex', async () => {
    expect(await setTo('hex', '#000000', 'hsl(0, 100%, 50%)')).toBe('#ff0000');
  });

  test('[PackComponent-ANTCOLOR-FMT-003] hex text on an rgb field exposes rgb', async () => {
    expect(await setTo('rgb', 'rgb(0, 0, 0)', '#010203')).toBe('rgb(1, 2, 3)');
  });

  test('[PackComponent-ANTCOLOR-FMT-004] control: hex text on a hex field is kept as given', async () => {
    expect(await setTo('hex', '#000000', '#010203')).toBe('#010203');
  });
});
