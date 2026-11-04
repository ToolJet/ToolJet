/**
 * Listview overflow rule, for every ListView (Legacy and the new styles), in records and in the header slot:
 * Text wraps while it fits; when it does not fit its box the last visible line ends with an ellipsis (a
 * multi-line clamp of as many lines as the box holds, one line for a one-line box) and a tooltip shows the full
 * text. Text with Dynamic height keeps growing. A Button label is one line with an ellipsis and a tooltip.
 * Only components inside a ListView change. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
 * (Listview-OVF-001..010). Real store, real RenderWidget.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'b1b1b1b1-0000-4000-8000-0000000000bb';
const HEADER = `${ID}-header`;
const LONG = 'A very long record title that cannot fit in a narrow card';
const FIELD_BY_FORMAT = { plainText: 'plain', markdown: 'md', html: 'html' };
const RECORDS = `{{[{ plain: '${LONG}', md: '**${LONG}**', html: '<b>${LONG}</b>', cta: '${LONG} button' }]}}`;
// Default Text: 14px at line height 1.5 is 21px a line; the box loses 2px to its border.
const ONE_LINE_BOX = 30;
const THREE_LINE_BOX = 70;

function child(id, name, type, properties, { parent = ID, height = ONE_LINE_BOX } = {}) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = parent;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  definition.layouts.desktop.height = height;
  return definition;
}

const recordText = (format, height, extra = {}) =>
  child(
    'txt1',
    'text1',
    'Text',
    { text: binding(`{{listItem.${FIELD_BY_FORMAT[format]}}}`), textFormat: binding(format), ...extra },
    { height }
  );
const headerText = (format, height) =>
  child(
    'hdr1',
    'headerText',
    'Text',
    {
      text: binding(format === 'plainText' ? LONG : format === 'markdown' ? `**${LONG}**` : `<b>${LONG}</b>`),
      textFormat: binding(format),
    },
    { parent: HEADER, height }
  );

const listview = createWidgetHarness({
  componentType: 'Listview',
  handle: 'listview1',
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('80'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: {
    txt1: recordText('plainText', ONE_LINE_BOX),
    btn1: child('btn1', 'button1', 'Button', { text: binding('{{listItem.cta}}') }),
  },
  capabilities: { dnd: true },
  preload: ['Tags'],
  widgetHeight: 300,
  widgetWidth: 200,
});

const standaloneText = createWidgetHarness({
  componentType: 'Text',
  handle: 'text9',
  id: 'txt9',
  defaultProperties: {
    text: binding(LONG),
    textFormat: binding('plainText'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
  },
  widgetHeight: ONE_LINE_BOX,
  widgetWidth: 200,
});

const FORMATS = ['plainText', 'markdown', 'html'];
const STYLES = [['legacy'], ['bordered'], ['card']];

const sectionChild = (scope) => document.querySelector(`${scope} .text-widget-section > div`);
const recordText1 = () => sectionChild('.list-item');
const headerText1 = () => sectionChild('.listview-header-wrapper');
const recordButtonLabel = () => document.querySelector('.list-item [data-cy$="-label"]');
const headerButtonLabel = () => document.querySelector('.listview-header-wrapper [data-cy$="-label"]');
const lineClamp = (node) => String(node.style.WebkitLineClamp ?? '');
const isClamped = (node) => lineClamp(node) !== '' || node.style.whiteSpace === 'nowrap';
// react-markdown is stubbed under jest and renders the raw source, so Markdown text is asserted with `toContain`.
const tooltip = () => document.querySelector('[role="tooltip"]');

// jsdom has no layout: report the content as bigger than its box, or as fitting (browser geometry is a genuine boundary).
const spies = [];
const setGeometry = ({ overflowing }) => {
  spies.splice(0).forEach((spy) => spy.mockRestore());
  const [scroll, client] = overflowing ? [400, 100] : [100, 100];
  ['scrollWidth', 'scrollHeight'].forEach((name) =>
    spies.push(jest.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(scroll))
  );
  ['clientWidth', 'clientHeight'].forEach((name) =>
    spies.push(jest.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(client))
  );
};
beforeEach(() => setGeometry({ overflowing: true }));
afterEach(() => spies.splice(0).forEach((spy) => spy.mockRestore()));

const mountRecord = async (options = {}) => {
  listview.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(recordText1() ?? recordButtonLabel()).toBeInTheDocument());
};
const mountHeader = async (format, height) => {
  listview.render({
    currentMode: 'view',
    properties: { showHeader: binding('{{true}}') },
    extraComponents: {
      hdr1: headerText(format, height),
      btn2: child('btn2', 'button2', 'Button', { text: binding(`${LONG} header`) }, { parent: HEADER }),
    },
  });
  await waitFor(() => expect(headerText1()).toBeInTheDocument());
};

describe('Listview: overflow', () => {
  beforeEach(listview.setup);
  afterEach(listview.teardown);

  test.each(FORMATS)(
    '[Listview-OVF-001] %s text in a one-line box clamps to one line with an ellipsis',
    async (format) => {
      // Break this catches: a one-line card whose title wraps onto a second line and spills out of the record.
      await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

      const text = recordText1();
      expect(text.textContent).toContain(LONG);
      if (format === 'plainText') {
        expect(text.style.whiteSpace).toBe('nowrap');
        expect(text.style.textOverflow).toBe('ellipsis');
      } else {
        expect(lineClamp(text)).toBe('1');
      }
      expect(text.style.overflow).toBe('hidden');
    }
  );

  test.each(FORMATS)(
    '[Listview-OVF-002] %s text in a three-line box wraps and clamps to three lines',
    async (format) => {
      // Break this catches: a tall box cut to one line, or text that runs past its box without an ellipsis.
      await mountRecord({ extraComponents: { txt1: recordText(format, THREE_LINE_BOX) } });

      const text = recordText1();
      expect(text.textContent).toContain(LONG);
      expect(lineClamp(text)).toBe('3');
      expect(text.style.whiteSpace).not.toBe('nowrap');
      expect(text.style.overflow).toBe('hidden');
    }
  );

  test.each(FORMATS)(
    '[Listview-OVF-003] %s text with Dynamic height keeps growing and is not clamped',
    async (format) => {
      // Break this catches: a Dynamic height Text that stops growing and hides its tail behind an ellipsis.
      await mountRecord({
        extraComponents: { txt1: recordText(format, ONE_LINE_BOX, { dynamicHeight: binding('{{true}}') }) },
      });

      expect(isClamped(recordText1())).toBe(false);
      await listview.session.user.hover(recordText1());
      expect(tooltip()).toBeNull();
    }
  );

  test.each(FORMATS)(
    '[Listview-OVF-004] %s text shows the full text in a tooltip when it overflows',
    async (format) => {
      // Break this catches: text clipped with no way to read the rest.
      await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

      await listview.session.user.hover(recordText1());

      await waitFor(() => expect(tooltip()?.textContent).toContain(LONG));
    }
  );

  test.each(FORMATS)('[Listview-OVF-004] %s text that fits shows no tooltip', async (format) => {
    // Break this catches: a tooltip on every record, repeating text that is fully visible.
    setGeometry({ overflowing: false });
    await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

    await listview.session.user.hover(recordText1());

    expect(tooltip()).toBeNull();
  });

  test.each(STYLES)('[Listview-OVF-005] the rule holds in the %s style', async (listStyle) => {
    // Break this catches: the rule applied to the new styles only, leaving saved Legacy ListViews wrapping.
    await mountRecord({
      styles: { listStyle: binding(listStyle) },
      extraComponents: { txt1: recordText('html', THREE_LINE_BOX) },
    });

    expect(lineClamp(recordText1())).toBe('3');
  });

  test('[Listview-OVF-007] a Button label in a record is one line with an ellipsis and a tooltip', async () => {
    // Break this catches: a button label that wraps ("But\n1") inside a narrow grid card.
    await mountRecord();

    expect(recordButtonLabel().style.whiteSpace).toBe('nowrap');
    expect(recordButtonLabel().style.textOverflow).toBe('ellipsis');
    await listview.session.user.hover(recordButtonLabel());
    await waitFor(() => expect(tooltip()?.textContent).toBe(`${LONG} button`));
  });
});

describe('Listview: overflow in the header slot', () => {
  beforeEach(listview.setup);
  afterEach(listview.teardown);

  test.each(FORMATS)(
    '[Listview-OVF-006] %s Text in the header clamps to its box and shows a tooltip',
    async (format) => {
      // Break this catches: the rule covering the records only, so a long header title wraps out of the header.
      await mountHeader(format, THREE_LINE_BOX);

      expect(lineClamp(headerText1())).toBe('3');
      await listview.session.user.hover(headerText1());
      await waitFor(() => expect(tooltip()?.textContent).toContain(LONG));
    }
  );

  test('[Listview-OVF-008] a Button label in the header is one line with an ellipsis and a tooltip', async () => {
    // Break this catches: the header Button wrapping its label while the record Buttons clip.
    await mountHeader('plainText', ONE_LINE_BOX);

    expect(headerButtonLabel().style.whiteSpace).toBe('nowrap');
    expect(headerButtonLabel().style.textOverflow).toBe('ellipsis');
    await listview.session.user.hover(headerButtonLabel());
    await waitFor(() => expect(tooltip()?.textContent).toBe(`${LONG} header`));
  });
});

describe('Text outside a ListView', () => {
  beforeEach(standaloneText.setup);
  afterEach(standaloneText.teardown);

  test.each(FORMATS)(
    '[Listview-OVF-009] a %s Text outside a ListView keeps wrapping and shows no tooltip',
    async (format) => {
      // Break this catches: the clipping leaking to every Text in the app.
      standaloneText.render({ currentMode: 'view', properties: { textFormat: binding(format) } });
      await waitFor(() => expect(sectionChild('')).toBeInTheDocument());

      expect(isClamped(sectionChild(''))).toBe(false);
      await standaloneText.session.user.hover(sectionChild(''));
      expect(tooltip()).toBeNull();
    }
  );
});

const TAGS_DATA = `{{[{ title: 'Chief executive officer', color: 'rgb(1, 2, 3)', textColor: 'rgb(4, 5, 6)' }]}}`;
const tagsChild = (extra = {}) =>
  child('tag1', 'tags1', 'Tags', { advanced: binding('{{true}}'), data: binding(TAGS_DATA), ...extra }, { height: 40 });
const chipOf = (scope) => document.querySelector(`${scope} .badge`);
const chipLabel = (scope) => chipOf(scope).querySelector('div');

const standaloneTags = createWidgetHarness({
  componentType: 'Tags',
  handle: 'tags9',
  id: 'tag9',
  defaultProperties: { advanced: binding('{{true}}'), data: binding(TAGS_DATA), overflow: binding('wrap') },
  defaultStyles: { size: binding('large') },
  widgetHeight: 40,
  widgetWidth: 120,
});

describe('Listview: a Tags chip follows the overflow rule', () => {
  beforeEach(listview.setup);
  afterEach(listview.teardown);

  test.each(['scroll', 'wrap'])(
    '[Listview-OVF-010] a too-wide chip in %s mode is capped at the box and ellipsized',
    async (overflow) => {
      // Break this catches: a chip wider than its box whose label is cut on both sides and loses its padding.
      await listview.render({
        currentMode: 'view',
        extraComponents: { tag1: tagsChild({ overflow: binding(overflow) }) },
      });
      await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());

      const chip = chipOf('.list-item');
      expect(Number.parseFloat(chip.style.maxWidth)).toBeGreaterThan(0);
      expect(chip.style.maxWidth).toMatch(/px$/);
      expect(chip.style.padding).not.toBe('');
      expect(chipLabel('.list-item').style.whiteSpace).toBe('nowrap');
      expect(chipLabel('.list-item').style.textOverflow).toBe('ellipsis');
      expect(chipLabel('.list-item').style.overflow).toBe('hidden');
      expect(chipLabel('.list-item').textContent).toBe('Chief executive officer');
    }
  );

  test('[Listview-OVF-010] the full label shows in a tooltip only when the chip is cut', async () => {
    // Break this catches: no way to read a cut label, or a tooltip on every chip that fits.
    await listview.render({ currentMode: 'view', extraComponents: { tag1: tagsChild() } });
    await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());
    await listview.session.user.hover(chipLabel('.list-item'));
    await waitFor(() => expect(tooltip()?.textContent).toBe('Chief executive officer'));
  });

  test('[Listview-OVF-010] a chip that fits shows no tooltip', async () => {
    // Break this catches: a tooltip repeating a fully visible label.
    setGeometry({ overflowing: false });
    await listview.render({ currentMode: 'view', extraComponents: { tag1: tagsChild() } });
    await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());
    await listview.session.user.hover(chipLabel('.list-item'));
    expect(tooltip()).toBeNull();
  });
});

describe('Tags outside a ListView', () => {
  beforeEach(standaloneTags.setup);
  afterEach(standaloneTags.teardown);

  test('[Listview-OVF-010] a chip outside a ListView keeps its own sizing and shows no tooltip', async () => {
    // Break this catches: the clipping leaking to every Tags widget in the app.
    standaloneTags.render({ currentMode: 'view' });
    await waitFor(() => expect(chipOf('')).toBeInTheDocument());

    expect(chipOf('').style.maxWidth).toBe('');
    expect(chipOf('').querySelector('div')).toBeNull();
    await standaloneTags.session.user.hover(chipOf(''));
    expect(tooltip()).toBeNull();
  });
});
