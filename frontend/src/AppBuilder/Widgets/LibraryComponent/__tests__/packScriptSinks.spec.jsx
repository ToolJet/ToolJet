import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// A pack property can be bound to query data, so a value that reaches the page as HTML or as a link must not be able
// to run script, in the editor or in a public app: the Map's tile attribution (Leaflet draws it as HTML), and the Ant
// Button's, Link's and Descriptions link's href (an <a href="javascript:..."> runs on click). The pack components, the
// inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const lib = (pack, file) => require(`../../../../../../packs/${pack}/src/lib/${file}`);
const antd = require('../../../../../../packs/antd/src/index.ts');

const SCRIPT_URLS = [
  'javascript:alert(1)',
  ' JaVaScRiPt:alert(1)',
  'java\tscript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
];

let mounts = 0;
const mountAnt = async (name, props) => {
  loadLibraryModule.mockResolvedValue(antd);
  mounts += 1;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="pack-script-sinks"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`sink-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="sink-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return root();
};

const hrefs = (root) => [...root.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));

describe('a pack link never takes a script URL', () => {
  describe.each(SCRIPT_URLS)('%s', (url) => {
    it('Ant Button', async () => {
      const root = await mountAnt('Button', { href: url, children: 'Go' });
      expect(hrefs(root)).toEqual([]);
    });

    it('Ant Link', async () => {
      const root = await mountAnt('Link', { href: url, children: 'Go' });
      expect(hrefs(root)).toEqual([]);
    });

    it('Ant Descriptions link item', async () => {
      const root = await mountAnt('Descriptions', { items: [{ label: 'Site', children: url, format: 'link' }] });
      expect(hrefs(root)).toEqual([]);
    });
  });

  it('keeps a web link', async () => {
    expect(hrefs(await mountAnt('Button', { href: 'https://tooljet.com', children: 'Go' }))).toEqual([
      'https://tooljet.com',
    ]);
    expect(hrefs(await mountAnt('Link', { href: 'mailto:hi@tooljet.com', children: 'Go' }))).toEqual([
      'mailto:hi@tooljet.com',
    ]);
    const root = await mountAnt('Descriptions', {
      items: [{ label: 'Site', children: 'https://tooljet.com', format: 'link' }],
    });
    expect(hrefs(root)).toEqual(['https://tooljet.com']);
  });
});

describe.each(['antd', 'shadcn'])('the %s Map tile attribution', (pack) => {
  const { tileSource } = lib(pack, 'ui2/charts/mapModel.ts');
  const own = (tileAttribution) =>
    tileSource({ tileUrl: 'https://tiles.example.com/{z}/{x}/{y}.png', tileAttribution }).attribution;
  const asDom = (html) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el;
  };

  it('drops markup that runs script', () => {
    const dom = asDom(own('<img src=x onerror="alert(1)"><script>alert(2)</script><svg onload="alert(3)"></svg>'));
    expect(dom.querySelector('script, img, svg')).toBeNull();
    expect(dom.innerHTML).not.toMatch(/onerror|onload|alert/);
  });

  it('drops a script link and keeps its text', () => {
    const dom = asDom(own('<a href="javascript:alert(1)" onclick="alert(2)">Tiles</a>'));
    expect(dom.textContent).toBe('Tiles');
    expect(dom.innerHTML).not.toMatch(/javascript|onclick/i);
  });

  it('keeps a credit link and entities, as the default attribution has', () => {
    const dom = asDom(own('&copy; <a href="https://tiles.example.com" target="_blank">Example</a> contributors'));
    expect(dom.textContent).toBe('© Example contributors');
    expect(dom.querySelector('a').getAttribute('href')).toBe('https://tiles.example.com');
  });

  it('also cleans an attribution shown over the default tiles', () => {
    const dom = asDom(tileSource({ tileAttribution: '<img src=x onerror="alert(1)">Mine' }).attribution);
    expect(dom.querySelector('img')).toBeNull();
    expect(dom.textContent).toBe('Mine');
  });
});
