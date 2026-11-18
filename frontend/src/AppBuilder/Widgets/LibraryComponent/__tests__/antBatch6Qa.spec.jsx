import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';
import { ANT_PACK_CSS, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design. The pack's components, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

// The declarations pack.css gives a selector, read off its rules.
const rule = (selector) => {
  const style = document.createElement('style');
  style.textContent = ANT_PACK_CSS;
  document.head.appendChild(style);
  const found = [...style.sheet.cssRules].find((r) => r.selectorText === selector);
  style.remove();
  return found?.style;
};

// PKB-41: Primary color did nothing on a Statistic (a red and a green one drew the same). It colours the figure; unset,
// the figure keeps Ant's heading colour (which Text color sets).
test('[PackComponent-STATISTIC-010] Primary color colours the figure', () => {
  expect(rule('.tj-ant-stat .ant-statistic-content').color).toBe(
    'var(--tj-ant-color-primary, var(--ant-color-text-heading))'
  );
});

// PKB-41: Container background, Border color and Border radius did nothing on a Switch. They fill, frame and round the
// widget's box, as on the Spin and the plain Icon; unset, the box stays bare.
describe('Ant Design Switch: Styles', () => {
  const root = (v) => v.root().querySelector('.tj-ant-root');

  test('[PackComponent-SWITCH-010] Container background, Border color and Border radius draw the box', async () => {
    const v = await mountPack(
      'antd',
      'Switch',
      { checked: true },
      { styles: { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 20 } }
    );

    expect(root(v).style.backgroundColor).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
    expect(root(v).style.border).toMatch(/#0000ff|rgb\(0, 0, 255\)/);
    expect(root(v).style.borderRadius).toBe('20px');
    // The label kept off the drawn edge.
    expect(root(v).style.paddingInline).toBe('8px');
  });

  test('[PackComponent-SWITCH-011] unset, the box has no colour, frame or corners of its own', async () => {
    const v = await mountPack('antd', 'Switch', { checked: true });

    expect(root(v).style.backgroundColor).toBe('');
    expect(root(v).style.border).toBe('');
    expect(root(v).style.borderRadius).toBe('');
    expect(root(v).style.paddingInline).toBe('');
  });
});

describe('Ant Design Transfer', () => {
  // PF-087: Set field value with one key as text ('invoices') was ignored: targetKeys became [] and nothing moved.
  test('[PackComponent-TRANSFER-010] Set field value takes one key as text', async () => {
    const v = await mountPack('antd', 'Transfer', {});

    await v.run('setFieldValue', 'invoices');
    await settle();
    expect(v.exposed.targetKeys).toEqual(['invoices']);

    // A list, and a list as JSON text, are still lists; empty text moves everything back.
    await v.run('setFieldValue', '["orders","invoices"]');
    await settle();
    expect(v.exposed.targetKeys).toEqual(['orders', 'invoices']);
    await v.run('setFieldValue', '');
    await settle();
    expect(v.exposed.targetKeys).toEqual([]);
  });

  // PF-086, PKB-76: the lists kept Ant's width (about 350px in all), so a narrower box cut off the right list and its move
  // buttons. The lists share the box's width, and in a box too narrow for two side by side they stack, the move buttons
  // between them pointing down and up. Read from the file as text: jsdom matches no container query, and ANT_PACK_CSS
  // has them taken out.
  test('[PackComponent-TRANSFER-011] the lists shrink to the box, and stack in a narrow one', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8');
    const block = (selector) => {
      const at = css.indexOf(selector);
      return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
    };
    expect(block('.tj-ant-transfer {')).toContain('container: tj-ant-transfer / inline-size;');
    expect(block('.tj-ant-transfer .ant-transfer-list {')).toContain('min-width: 0;');
    const narrow = css.slice(css.indexOf('@container tj-ant-transfer'));
    expect(narrow).toMatch(/^@container tj-ant-transfer \(max-width: \d+px\)/);
    expect(block('@container tj-ant-transfer')).toContain('flex-direction: column;');
  });
});
