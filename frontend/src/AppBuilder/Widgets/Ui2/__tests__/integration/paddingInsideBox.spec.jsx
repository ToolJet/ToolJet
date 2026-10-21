/**
 * A UI 2.0 widget's padding style shrinks its content area inside the box; it never pushes the content past it. In the
 * editor (which draws the saved height) the List view was as tall as its rows plus its padding, so a high padding (or
 * a few rows) drew rows over the widgets below. It is now drawn at its box's height there, its rows scrolling inside
 * the padding. Of the UI 2.0 widgets only the List view has a padding style: cards and fields have none (the layout's
 * FlexContainer, which has one, already scrolls inside its border). Real store, real RenderWidget, real widget.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

const list = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: 'list1',
  widgetHeight: 300,
  widgetWidth: 500,
  capabilities: { dnd: true },
});
const rows = () => document.querySelector('.canvas-component [role=list]');
const PADDING = { padding: binding('140') };

describe('A padding style stays inside the box', () => {
  beforeEach(() => list.setup());
  afterEach(() => list.teardown());

  test('only the List view has a padding style among the UI 2.0 widgets', () => {
    expect(shadcnConfigs.filter((c) => c.styles?.padding).map((c) => c.name)).toEqual(['ShadListView']);
  });

  test.each([
    ['the editor', 'edit', {}],
    ['the viewer with dynamic height off', 'view', { dynamicHeight: binding('{{false}}') }],
  ])('in %s the padded List view keeps its box height and scrolls its rows inside', (_, currentMode, properties) => {
    list.render({ currentMode, properties, styles: PADDING });
    const el = document.querySelector('.canvas-component .tj-shadcn');
    expect(el.style.padding).toBe('140px');
    expect(el.style.height).toBe('100%');
    expect(el.style.overflow).toBe('hidden');
    expect(rows().style.overflowY).toBe('auto');
    expect(rows().style.flex).toBe('1 1 0px');
  });

  test('with dynamic height on in the viewer the List view grows with its rows and padding', () => {
    list.render({ currentMode: 'view', styles: PADDING });
    const el = document.querySelector('.canvas-component .tj-shadcn');
    expect(el.style.height).toBe('');
    expect(rows().style.overflowY).toBe('');
  });
});
