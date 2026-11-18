import { toolJetSdk } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, copyWithPackCss, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Divider. The pack's Divider, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

const LONG =
  'Shipping, billing and returns settings for every region in the workspace live in this section of the page';

// PF-244: the Divider's Type dropdown had no fx toggle, so its direction could not be bound: the editor leaves fx off a
// field labelled exactly "Type" (SingleLineCodeEditor). It is labelled Direction; the saved property is still type.
describe('Ant Design Divider Type in the Inspector', () => {
  test('[PackComponent-DIVIDER-001] the type property is labelled Direction, not Type', async () => {
    const real = toolJetSdk.useStateEnumeration;
    const declared = {};
    jest.spyOn(toolJetSdk, 'useStateEnumeration').mockImplementation((options) => {
      declared[options.name] = options;
      return real(options);
    });
    await mountPack('antd', 'Divider', {});

    expect(declared.type.label).toBe('Direction');
  });
});

// PKB-68: a long Text ran past the right edge of a narrow box (Ant keeps the text on one line). It now ends in an
// ellipsis inside the box, the full text as its title.
describe('Ant Design Divider with a long Text', () => {
  test('[PackComponent-DIVIDER-002] the text ends in an ellipsis inside the box', async () => {
    const v = await mountPack('antd', 'Divider', { children: LONG });
    const text = copyWithPackCss(v.root()).querySelector('.ant-divider-inner-text');

    expect(getComputedStyle(text).overflow).toBe('hidden');
    expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(text).minWidth).toBe('0');
    expect(v.root().querySelector('.ant-divider-inner-text [title]').getAttribute('title')).toBe(LONG);
  });

  // Ant's two line segments are 50% wide each, so they always fill the box and a text that could shrink was cut short
  // in a box with plenty of room ("devan…"). The lines give way first; the text is cut past 85% of the box, so some
  // line always shows and it still reads as a divider, not a text.
  test('[PackComponent-DIVIDER-006] a text that fits the box is shown whole', async () => {
    const v = await mountPack('antd', 'Divider', { children: 'Section' });
    const text = copyWithPackCss(v.root()).querySelector('.ant-divider-inner-text');

    expect(getComputedStyle(text).flexShrink).toBe('0');
    expect(getComputedStyle(text).maxWidth).toBe('85%');
    expect(getComputedStyle(text).boxSizing).toBe('border-box');
  });
});

// PKB-41: only Text color changed the Divider. Border color (else Primary color) now colours the line, and Container
// background and Border radius draw the widget box; unset, Ant's look.
describe('Ant Design Divider Styles', () => {
  const declared = (selector, property) => {
    const style = document.createElement('style');
    style.textContent = ANT_PACK_CSS;
    document.head.appendChild(style);
    const rule = [...style.sheet.cssRules].find((r) =>
      (r.selectorText ?? '').split(',').some((s) => s.trim() === selector)
    );
    style.remove();
    return rule?.style.getPropertyValue(property) ?? '';
  };
  const root = (v) => v.root().querySelector('.tj-ant-root');

  test('[PackComponent-DIVIDER-003] Border color, else Primary color, colours the line', async () => {
    const v = await mountPack('antd', 'Divider', { children: 'Section' });

    expect(v.root().querySelector('.tj-ant-divider .ant-divider')).toBeTruthy();
    expect(declared('.tj-ant-divider .ant-divider', 'border-color')).toBe(
      'var(--tj-ant-color-border, var(--tj-ant-color-primary, var(--ant-color-split)))'
    );
  });

  test('[PackComponent-DIVIDER-004] Container background and Border radius draw the widget box', async () => {
    const v = await mountPack(
      'antd',
      'Divider',
      { children: 'Section' },
      { styles: { colorBgContainer: '#ffeeaa', borderRadius: 12 } }
    );

    expect(root(v).style.backgroundColor).toBe('rgb(255, 238, 170)');
    expect(root(v).style.borderRadius).toBe('12px');
  });

  test('[PackComponent-DIVIDER-005] left unset, the box stays bare', async () => {
    const v = await mountPack('antd', 'Divider', { children: 'Section' });

    expect(root(v).style.backgroundColor).toBe('');
    expect(root(v).style.borderRadius).toBe('');
  });
});
