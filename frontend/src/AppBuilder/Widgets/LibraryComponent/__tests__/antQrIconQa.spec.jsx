import { waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design QR Code and Icon. The pack's components, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// jsdom lays nothing out: a box of `w` by `h` is given to every element while `fn` runs.
// The stubs sit on HTMLElement.prototype, over Element.prototype's own getters, and are deleted afterwards.
const withBox = async (w, h, fn) => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => w });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => h });
  try {
    return await fn();
  } finally {
    delete HTMLElement.prototype.clientWidth;
    delete HTMLElement.prototype.clientHeight;
  }
};

afterEach(() => {
  document.body.innerHTML = '';
});

const qrOf = async (v) => {
  await waitFor(() => expect(v.root().querySelector('.ant-qrcode svg')).toBeTruthy());
  return v.root().querySelector('.ant-qrcode');
};
const modules = (svg) => svg.querySelectorAll('svg path')[1].getAttribute('d');

// PF-226: Error levels L, M and Q drew the same code. Ant's QRCode boosts a value's error level as far as its code's
// size allows (boostLevel), so a short value came out at the same level whatever was picked. The level picked is used.
describe('Ant Design QR Code error level', () => {
  test('[PackComponent-QRCODE-001] L, M, Q and H each draw a different code', async () => {
    const codes = [];
    for (const errorLevel of ['L', 'M', 'Q', 'H']) {
      const v = await mountPack('antd', 'QRCode', { value: 'https://tooljet.com', errorLevel });
      codes.push(modules(await qrOf(v)));
    }

    expect(new Set(codes).size).toBe(4);
  });
});

// PF-227: a Size larger than the box drew the code at that size, spilling out of the box. It shrinks to fit the box,
// and keeps the Size set when the box is bigger.
describe('Ant Design QR Code fits its box', () => {
  test('[PackComponent-QRCODE-002] Size 400 in a 200px box shrinks to the box', async () => {
    const qr = await withBox(300, 200, async () => qrOf(await mountPack('antd', 'QRCode', { size: 400 })));

    expect(qr.style.width).toBe('200px');
    expect(qr.style.height).toBe('200px');
  });

  test('[PackComponent-QRCODE-003] a box bigger than the code keeps the Size set', async () => {
    const qr = await withBox(600, 600, async () => qrOf(await mountPack('antd', 'QRCode', { size: 160 })));

    expect(qr.querySelector('svg').getAttribute('width')).toBe('160');
  });
});

// PKB-41: Primary color and Border color did nothing on a QR Code. Primary color draws the modules when Text color is
// not set; Border color draws the bordered frame.
describe('Ant Design QR Code: Styles', () => {
  test('[PackComponent-QRCODE-004] Primary color draws the modules', async () => {
    const qr = await qrOf(await mountPack('antd', 'QRCode', {}, { styles: { colorPrimary: '#ff0000' } }));

    expect(qr.style.color).toMatch(/#ff0000|rgb\(255, 0, 0\)/);
  });

  test('[PackComponent-QRCODE-005] Text color wins over Primary color', async () => {
    const qr = await qrOf(
      await mountPack('antd', 'QRCode', {}, { styles: { colorPrimary: '#ff0000', colorText: '#0000ff' } })
    );

    expect(qr.style.color).not.toMatch(/#ff0000|rgb\(255, 0, 0\)/);
  });

  test('[PackComponent-QRCODE-006] Border color draws the frame', async () => {
    const qr = await qrOf(await mountPack('antd', 'QRCode', {}, { styles: { colorBorder: '#00aa00' } }));

    expect(qr.style.borderColor).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });
});

const iconOf = async (v) => {
  await waitFor(() => expect(v.root().querySelector('.tj-ant-icon')).toBeTruthy());
  return v.root().querySelector('.tj-ant-icon');
};

// PKB-41: Container background and Border color did nothing on an Icon. On a chip they fill it and draw its border; on
// a plain icon they fill and frame the widget's box.
describe('Ant Design Icon: Styles', () => {
  const styles = { colorBgContainer: '#ffeeaa', colorBorder: '#00aa00' };

  test.each(['circle', 'square'])('[PackComponent-ICON-001] a %s chip takes them', async (chip) => {
    const icon = await iconOf(await mountPack('antd', 'Icon', { chip }, { styles }));

    expect(icon.style.background).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
    expect(icon.style.border).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });

  test('[PackComponent-ICON-002] a plain icon fills and frames its box', async () => {
    const v = await mountPack('antd', 'Icon', { chip: 'none' }, { styles });
    await iconOf(v);
    const root = v.root().querySelector('.tj-ant-root');

    expect(root.style.backgroundColor).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
    expect(root.style.border).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });

  test("[PackComponent-ICON-003] unset, a chip keeps its tint and a plain icon's box stays clear", async () => {
    const chip = await iconOf(await mountPack('antd', 'Icon', { chip: 'circle' }));
    const plain = await mountPack('antd', 'Icon', { chip: 'none' });
    await iconOf(plain);

    expect(chip.style.border).toBe('');
    expect(plain.root().querySelector('.tj-ant-root').style.backgroundColor).toBe('');
  });
});

// PKB-76: a plain icon larger than its box was cut off (Size 200 in a 60px box). It shrinks to the box, as the chip
// already did.
describe('Ant Design Icon fits its box', () => {
  test('[PackComponent-ICON-004] Size 200 in a 60px box draws at 60px', async () => {
    const icon = await withBox(260, 60, async () => iconOf(await mountPack('antd', 'Icon', { size: 200 })));

    expect(icon.style.fontSize).toBe('60px');
  });

  test('[PackComponent-ICON-005] a box bigger than the icon keeps the Size set', async () => {
    const icon = await withBox(260, 60, async () => iconOf(await mountPack('antd', 'Icon', { size: 20 })));

    expect(icon.style.fontSize).toBe('20px');
  });
});
