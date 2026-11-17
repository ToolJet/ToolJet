import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// jsdom has no CSS.supports; a tiny stand-in that accepts hex colours only.
global.CSS = { supports: (_p, v) => /^#[0-9a-f]{3,8}$/i.test(String(v)) };

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
const mount = async (props, styles = {}, name = 'Tag') => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-tag-fixes"
      componentName={name}
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(name) => events.push(name)}
      actions={new Map()}
      host={makeHost(name)}
      dataCy={`ant-tag-${mounts}`}
    />
  );
  const root = () => document.querySelector(`[data-cy="ant-tag-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-ant-root, .tj-cc-error')).toBeTruthy());
  return { root, exposed, events };
};

describe('Ant Tag fixes', () => {
  it('PF-035 long text is clipped inside a flex tag and shown in a title', async () => {
    const v = await mount({ children: 'A very long tag text' });
    await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeTruthy());
    const tag = v.root().querySelector('.ant-tag');
    expect(tag.classList.contains('tj-ant-tag')).toBe(true);
    expect(tag.getAttribute('title')).toBe('A very long tag text');
    expect(tag.querySelector('.tj-ant-tag-text').textContent).toBe('A very long tag text');
  });

  describe('PF-036 colour', () => {
    const tagFor = async (color) => {
      const v = await mount({ children: 'T', color });
      await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeTruthy());
      return v.root().querySelector('.ant-tag');
    };
    it('a preset in another case still applies', async () => {
      const tag = await tagFor('SUCCESS');
      expect(tag.classList.contains('ant-tag-success')).toBe(true);
      expect(tag.classList.contains('ant-tag-has-color')).toBe(false);
    });
    it('an unknown colour is ignored', async () => {
      const tag = await tagFor('notacolor');
      expect(tag.classList.contains('ant-tag-has-color')).toBe(false);
      expect(tag.style.backgroundColor).toBe('');
    });
    it('a CSS colour is applied', async () => {
      const tag = await tagFor('#ff0000');
      expect(tag.classList.contains('ant-tag-has-color')).toBe(true);
      expect(tag.style.backgroundColor).not.toBe('');
    });
    it('a palette name applies', async () => {
      const tag = await tagFor('blue');
      expect(tag.classList.contains('ant-tag-blue')).toBe(true);
    });
  });

  it('PF-037 the close control is a focusable button that closes the tag', async () => {
    const v = await mount({ children: 'T', closable: true });
    await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeTruthy());
    const btn = v.root().querySelector('button.tj-ant-tag-close');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Remove tag');
    btn.focus();
    expect(v.root().activeElement).toBe(btn);
    fireEvent.click(btn);
    await waitFor(() => expect(v.events).toContain('onClose'));
    await waitFor(() => expect(v.exposed.closed).toBe(true));
    await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeNull());
  });

  // Tag's colours come from its Color property only: the Primary, Text and Container colour styles are gone. Border color
  // and Border radius style the tag itself; Bordered turns its border on and off.
  describe('Tag styles', () => {
    const tagOf = async (props, st) => {
      const v = await mount(props, st);
      await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeTruthy());
      return { v, tag: v.root().querySelector('.ant-tag') };
    };
    it('Primary, Text and Container colours no longer change the tag', async () => {
      const { v, tag } = await tagOf(
        { children: 'T' },
        { colorPrimary: '#ff0000', colorText: '#00ff00', colorBgContainer: '#ffeeaa' }
      );
      expect(tag.style.backgroundColor).toBe('');
      const vars = v.root().querySelector('.tj-ant-root').getAttribute('style') ?? '';
      expect(vars).not.toMatch(/--tj-ant-color-(primary|text|bg-container)/);
    });
    it('Border color and Border radius style the tag itself (no box), over the Color preset', async () => {
      const { v, tag } = await tagOf({ children: 'T', color: 'success' }, { colorBorder: '#0000ff', borderRadius: 12 });
      expect(tag.style.borderColor).toMatch(/0, 0, 255|#0000ff/i);
      expect(tag.style.borderRadius).toBe('12px');
      expect(v.root().querySelector('.tj-ant-tag-box')).toBeNull();
    });
    it('Bordered off: no border, whatever Border color is', async () => {
      const { tag } = await tagOf({ children: 'T', bordered: false }, { colorBorder: '#0000ff' });
      expect(tag.classList.contains('ant-tag-borderless')).toBe(true);
      expect(tag.style.borderColor).toBe('');
    });
    it('unset styles add nothing inline', async () => {
      const { tag } = await tagOf({ children: 'T' }, {});
      expect(tag.style.borderColor).toBe('');
      expect(tag.style.borderRadius).toBe('');
    });
  });
});

// The row of tags (Tags) had the same spill: a tag longer than the row ran past the box. Each tag is cut to the row's
// width with an ellipsis, its full text in a title, like the single Tag.
describe('Ant Tags: a long tag', () => {
  it('each tag carries the ellipsis text and a title', async () => {
    const long = 'A very long tag text that is wider than the row';
    const v = await mount({ tags: ['Design', long] }, {}, 'Tags');
    await waitFor(() => expect(v.root().querySelectorAll('.ant-tag')).toHaveLength(2));
    const tag = v.root().querySelectorAll('.ant-tag')[1];
    expect(tag.classList.contains('tj-ant-tag')).toBe(true);
    expect(tag.getAttribute('title')).toBe(long);
    expect(tag.querySelector('.tj-ant-tag-text').textContent).toBe(long);
  });

  it('Tags: box styles go on the widget box, not on the provider root', async () => {
    const v = await mount(
      { tags: ['A'] },
      { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 10 },
      'Tags'
    );
    await waitFor(() => expect(v.root().querySelector('.tj-ant-tag-box')).toBeTruthy());
    const box = v.root().querySelector('.tj-ant-tag-box');
    expect(box.querySelector('.tj-ant-tags')).toBeTruthy();
    expect(box.style.background).toContain('rgb(255, 238, 170)');
    expect(box.style.border).toContain('1px solid');
    expect(box.style.border).toMatch(/0, 0, 255|#0000ff/i);
    expect(box.style.borderRadius).toBe('10px');
    const rootStyle = v.root().querySelector('.tj-ant-root').getAttribute('style') || '';
    expect(rootStyle).not.toContain('--tj-ant-color-bg-container');
    expect(rootStyle).not.toContain('--tj-ant-color-border');
    expect(rootStyle).not.toContain('--tj-ant-border-radius');
  });

  it('Tags: Primary and Text colours are no longer styles and change nothing', async () => {
    const v = await mount({ tags: ['A'] }, { colorPrimary: '#ff0000', colorText: '#00ff00' }, 'Tags');
    await waitFor(() => expect(v.root().querySelector('.ant-tag')).toBeTruthy());
    const rootStyle = v.root().querySelector('.tj-ant-root').getAttribute('style') || '';
    expect(rootStyle).not.toMatch(/--tj-ant-color-(primary|text)/);
  });

  it('Tags: an unstyled row has a box with no background or border', async () => {
    const v = await mount({ tags: ['A'] }, {}, 'Tags');
    await waitFor(() => expect(v.root().querySelector('.tj-ant-tag-box')).toBeTruthy());
    const box = v.root().querySelector('.tj-ant-tag-box');
    expect(box.style.background).toBe('');
    expect(box.style.border).toBe('');
    expect(box.style.borderRadius).toBe('');
  });
});
