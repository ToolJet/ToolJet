import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';

// Pin icons: lucide is loaded once a map names an icon, and each icon is drawn to SVG text once for every map on the
// page. Each test loads the loader afresh, with an SVG renderer it controls.
let render;
let loader;
beforeEach(() => {
  render = jest.fn((element) => `<svg data-icon="${element.type.displayName || 'icon'}"></svg>`);
  jest.isolateModules(() => {
    jest.doMock('react-dom/server', () => ({ renderToStaticMarkup: (...args) => render(...args) }));
    loader = require('@/AppBuilder/Widgets/Ui2/Map/mapLayers');
  });
});
afterEach(() => jest.dontMock('react-dom/server'));

describe('pin icon loader', () => {
  it('retries after a load that failed, instead of failing every later load', async () => {
    // Release audit 2: the failed load stayed in the chain, so no icon loaded again until the page reloaded.
    render.mockImplementationOnce(() => {
      throw new Error('chunk failed');
    });
    expect(await loader.loadIcons(['zap'])).toBe(false);
    expect(loader.iconSvg('zap')).toBe('');
    expect(await loader.loadIcons(['zap'])).toBe(true);
    expect(loader.iconSvg('zap')).toContain('<svg');
    expect(await loader.loadIcons(['snowflake'])).toBe(true);
  });

  it('draws an icon once when maps ask for it at the same time, and tells each of them when it is ready', async () => {
    const [a, b] = await Promise.all([loader.loadIcons(['zap']), loader.loadIcons(['zap', 'droplets'])]);
    expect([a, b]).toEqual([true, true]);
    expect(render).toHaveBeenCalledTimes(2);
    expect(loader.iconSvg('droplets')).toContain('<svg');
    expect(await loader.loadIcons(['zap', 'droplets'])).toBe(false);
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('loads lucide again after its download failed', async () => {
    let downloads = 0;
    jest.isolateModules(() => {
      jest.doMock('lucide-react', () => {
        downloads += 1;
        if (downloads === 1) throw new Error('chunk failed');
        return jest.requireActual('lucide-react');
      });
      loader = require('@/AppBuilder/Widgets/Ui2/Map/mapLayers');
    });
    expect(await loader.loadIcons(['zap'])).toBe(false);
    expect(await loader.loadIcons(['zap'])).toBe(true);
    expect(downloads).toBe(2);
    jest.dontMock('lucide-react');
  });
});
