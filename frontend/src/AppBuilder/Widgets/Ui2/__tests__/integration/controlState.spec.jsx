/**
 * What every UI 2.0 widget does the same way: the standard visibility, disabled and loading controls, as properties
 * and as the setVisibility, setDisable and setLoading actions, exposed as isVisible, isDisabled and isLoading; and the
 * skeleton loading look on the widgets that offer one. Each widget's own behaviour is in
 * Ui2/<Widget>/__tests__/integration/<Type>.spec.jsx.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';

// The Dialog is ModalV2 in the UI 2.0 look and keeps ModalV2's own controls (setDisableTrigger, setDisableModal).
const TYPES = shadcnConfigs.map((c) => c.name).filter((type) => type !== 'ShadDialog');
const SKELETON_TYPES = shadcnConfigs.filter((c) => 'loadingIndicator' in c.properties).map((c) => c.name);
// The Dialog's dynamicHeight is ModalV2's: it sizes the open modal's body, not the widget's box on the canvas.
const DYNAMIC_HEIGHT_TYPES = shadcnConfigs
  .filter((c) => 'dynamicHeight' in c.properties && c.name !== 'ShadDialog')
  .map((c) => c.name);

const root = (container) => container.querySelector('.tj-shadcn');
// Busy is announced on the widget or, for a board or list that keeps its rows on screen while it reloads, on them.
const busy = (container) => container.querySelector('[aria-busy=true], [role=status]');

const harnessFor = (type) =>
  createWidgetHarness({
    componentType: type,
    handle: 'w1',
    id: 'w1',
    widgetHeight: 200,
    widgetWidth: 400,
    // Container widgets (Tabs, List view, a Kanban with card content) mount canvases, which need the app's dnd provider.
    capabilities: { dnd: true },
  });

describe.each(TYPES)('%s standard controls', (type) => {
  const widget = harnessFor(type);
  const render = (properties = {}) => widget.render({ currentMode: 'view', properties });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-CTL-001] renders its defaults visible, enabled and not loading`, async () => {
    const { container } = render();

    await waitFor(() => expect(root(container)).toBeInTheDocument());
    expect(root(container).style.display).not.toBe('none');
    expect(widget.exposed()).toMatchObject({ isVisible: true, isDisabled: false, isLoading: false });
  });

  test(`[${type}-CTL-002] visibility, disabledState and loadingState properties hide, disable and load it`, async () => {
    const hidden = render({ visibility: binding('{{false}}') });
    await waitFor(() => expect(widget.exposed()?.isVisible).toBe(false));
    expect(root(hidden.container)?.style.display ?? 'none').toBe('none');

    const loading = render({ loadingState: binding('{{true}}') });
    await waitFor(() => expect(widget.exposed()?.isLoading).toBe(true));
    await waitFor(() => expect(busy(loading.container)).toBeInTheDocument());

    render({ disabledState: binding('{{true}}') });
    await waitFor(() => expect(widget.exposed()?.isDisabled).toBe(true));
  });

  test(`[${type}-CTL-003] setVisibility, setDisable and setLoading change it at run time`, async () => {
    const { container } = render();
    await waitFor(() => expect(root(container)).toBeInTheDocument());

    await widget.act('setLoading', true);
    await waitFor(() => expect(busy(container)).toBeInTheDocument());
    await widget.act('setLoading', false);
    await widget.act('setDisable', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    await widget.act('setVisibility', false);
    await waitFor(() => expect(root(container).style.display).toBe('none'));
    expect(widget.exposed().isVisible).toBe(false);
  });
});

describe.each(SKELETON_TYPES)('%s loading look', (type) => {
  const widget = harnessFor(type);
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-CTL-004] loadingIndicator skeleton draws a skeleton while loading`, async () => {
    const { container } = widget.render({
      currentMode: 'view',
      properties: {
        loadingState: binding('{{true}}'),
        loadingIndicator: binding('skeleton'),
        // A board with cards keeps them on screen while it reloads; its skeleton is for the first load.
        ...(type === 'ShadKanban' && { data: binding('{{[]}}') }),
      },
    });

    await waitFor(() => expect(container.querySelector('.tw-animate-pulse')).toBeInTheDocument());
  });
});

// Dynamic height: in view mode a widget with it on sizes its box to its content through ToolJet's reflow (a temporary
// layout of the measured height); with it off the box keeps its drawn height. jsdom has no layout, so the content is
// given a measured height of 333px.
describe.each(DYNAMIC_HEIGHT_TYPES)('%s dynamic height', (type) => {
  const widget = createWidgetHarness({
    componentType: type,
    handle: 'w1',
    id: 'w1',
    widgetHeight: 200,
    widgetWidth: 400,
    offsetHeight: 333,
    capabilities: { dnd: true },
  });
  // An image fits its height to its width only with an aspect ratio; without one it fills the box drawn for it.
  const extra = type === 'ShadImage' ? { aspectRatio: binding('16/9') } : {};
  const reflowedHeight = () => store().temporaryLayouts?.w1?.height;
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test(`[${type}-CTL-005] dynamicHeight on asks the reflow to fit the box to its content`, async () => {
    widget.render({ currentMode: 'view', properties: { ...extra, dynamicHeight: binding('{{true}}') } });

    await waitFor(() => expect(reflowedHeight()).toBeDefined());
  });

  test(`[${type}-CTL-006] dynamicHeight off leaves the drawn box to the grid`, async () => {
    widget.render({ currentMode: 'view', properties: { ...extra, dynamicHeight: binding('{{false}}') } });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(reflowedHeight()).toBeUndefined();
  });
});
