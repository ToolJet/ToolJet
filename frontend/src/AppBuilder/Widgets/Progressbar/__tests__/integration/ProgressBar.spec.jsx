/**
 * ProgressBar behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/ProgressBar/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 */
import { waitFor } from '@testing-library/react';
import { progressbarConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/progressbar';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { progressbarConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/progressbar';

const ID = 'pb1';
const HANDLE = 'progressbar1';
const ID2 = 'pb2';
const HANDLE2 = 'progressbar2';
const TEXT = '#3366ff';
const TRACK = '#dddddd';
const PROGRESS = '#ff8800';
const COMPLETE = '#008844';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
const LAYOUT_HEIGHT = 104;
const INNER_HEIGHT = LAYOUT_HEIGHT - 4;
const PADDED_HEIGHT = INNER_HEIGHT - 4;

const defaultProperties = {
  labelType: binding('auto'),
  label: binding(''),
  progress: binding('{{50}}'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
};

const defaultStyles = {
  textColor: binding(TEXT),
  textSize: binding('{{30}}'),
  alignment: binding('side'),
  direction: binding('left'),
  width: binding('{{33}}'),
  auto: binding('{{true}}'),
  trackColor: binding(TRACK),
  progressTrackColor: binding(PROGRESS),
  completionColor: binding(COMPLETE),
  progressBarThickness: binding('{{20}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
};

const widget = createWidgetHarness({
  componentType: 'ProgressBar',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
  widgetHeight: LAYOUT_HEIGHT,
  widgetWidth: 240,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) =>
  container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const labelNode = (componentId = ID) => document.getElementById(`${componentId}-label`);
const track = (container, handle = HANDLE) => root(container, handle)?.lastElementChild?.firstElementChild;
const fill = (container, handle = HANDLE) => {
  const first = track(container, handle)?.firstElementChild;
  if (first?.style?.position === 'relative') return first.firstElementChild;
  return first;
};
const isLoadingStrip = (container, handle = HANDLE) =>
  Boolean(fill(container, handle)?.style?.animation?.includes('progressLoading'));
const percentOf = (computedHeight, n) => `${(computedHeight * n) / 100}px`;

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}
async function setStyle(style, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, style, value, 'styles'));
}

function progressBarDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, 'ProgressBar', { ...defaultProperties, ...properties });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

describe('ProgressBar widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[ProgressBar-DEF-001] default widget renders 50% and publishes its initial state', async () => {
    // Break this catches: seeding the wrong value/state or disconnecting the Auto label from initial progress.
    const { container } = widget.render();

    await waitFor(() => expect(widget.exposed()).toMatchObject({ value: 50, isVisible: true, isLoading: false }));
    expect(labelNode()).toHaveTextContent('50%');
    expect(fill(container)).toHaveStyle({ width: '50%' });
    expect(isLoadingStrip(container)).toBe(false);
  });

  test('[ProgressBar-LBL-001] Auto and Custom labels follow their own sources', async () => {
    // Break this catches: using authored text in Auto mode or replacing a Custom label when value changes.
    const { container } = widget.render();

    await setProperty('progress', '{{64}}');
    await waitFor(() => expect(labelNode()).toHaveTextContent('64%'));

    await setProperty('labelType', 'custom');
    await setProperty('label', '<b>Ready</b>');
    await waitFor(() => expect(labelNode()).toHaveTextContent('<b>Ready</b>'));
    expect(labelNode().querySelector('b')).toBeNull();

    await widget.act('setValue', 72);
    expect(labelNode()).toHaveTextContent('<b>Ready</b>');
    expect(fill(container)).toHaveStyle({ width: '72%' });

    await setProperty('label', '');
    await waitFor(() => expect(labelNode()).toBeNull());
  });

  test('[ProgressBar-VAL-001] progress updates fill width, Auto label and exposed value without remounting', async () => {
    // Break this catches: updating only the exposed value while leaving the fill or Auto label stale.
    const { container } = widget.render();
    const initialRoot = root(container);

    await setProperty('progress', '{{75}}');

    await waitFor(() => expect(widget.exposed().value).toBe(75));
    expect(labelNode()).toHaveTextContent('75%');
    expect(fill(container)).toHaveStyle({ width: '75%' });
    expect(root(container)).toBe(initialRoot);
  });

  test('[ProgressBar-BND-001] shipped clamp, falsy values and public NaN-to-0', async () => {
    // Break this catches: dropping the 0–100 clamp, leaving negatives visible, or using the wrong completion color.
    const { container } = widget.render();

    await setProperty('progress', '{{-20}}');
    await waitFor(() => expect(widget.exposed().value).toBe(0));
    expect(labelNode()).toHaveTextContent('0%');
    expect(fill(container)).toHaveStyle({ width: '0%', backgroundColor: PROGRESS });

    await setProperty('progress', '');
    await waitFor(() => expect(widget.exposed().value).toBe(0));

    await setProperty('progress', '{{150}}');
    await waitFor(() => expect(widget.exposed().value).toBe(100));
    expect(labelNode()).toHaveTextContent('100%');
    expect(fill(container)).toHaveStyle({ width: '100%', backgroundColor: COMPLETE });

    await widget.act('setValue', 49.6);
    expect(widget.exposed().value).toBe(49.6);
    expect(labelNode()).toHaveTextContent('50%');
    expect(fill(container)).toHaveStyle({ width: '49.6%' });

    await widget.act('setValue', NaN);
    expect(widget.exposed().value).toBe(0);
    expect(labelNode()).toHaveTextContent('0%');
    expect(fill(container)).toHaveStyle({ width: '0%' });
  });

  test('[ProgressBar-ACT-001] registered actions update presentation and exposed state', async () => {
    // Break this catches: publishing action state without re-rendering, or exposing a non-callable handle.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().setValue).toBeInstanceOf(Function));
    expect(widget.exposed().setVisibility).toBeInstanceOf(Function);
    expect(widget.exposed().setLoading).toBeInstanceOf(Function);

    await widget.act('setValue', 35);
    expect(widget.exposed().value).toBe(35);
    expect(labelNode()).toHaveTextContent('35%');
    expect(fill(container)).toHaveStyle({ width: '35%' });

    await widget.act('setLoading', 1);
    expect(widget.exposed().isLoading).toBe(true);
    expect(isLoadingStrip(container)).toBe(true);
    expect(canvasNode(container)).toHaveClass('disabled');

    await widget.act('setLoading', 0);
    await widget.act('setVisibility', 0);
    expect(widget.exposed()).toMatchObject({ isVisible: false, isLoading: false });
    expect(root(container)).toBeNull();
  });

  test('[ProgressBar-PREC-001] actions survive no-op resolution and yield to changed matching properties', async () => {
    // Break this catches: syncing properties on every render and silently undoing CSA state.
    const { container } = widget.render();

    await widget.act('setValue', 70);
    await widget.act('setLoading', true);
    await setStyle('alignment', 'top');
    await setProperty('progress', '{{50}}');
    await setProperty('loadingState', '{{false}}');

    expect(widget.exposed()).toMatchObject({ value: 70, isLoading: true });
    expect(isLoadingStrip(container)).toBe(true);

    await setProperty('progress', '{{80}}');
    await setProperty('loadingState', '{{true}}');
    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(widget.exposed()).toMatchObject({ value: 80, isLoading: false }));
    expect(labelNode()).toHaveTextContent('80%');
    expect(fill(container)).toHaveStyle({ width: '80%' });
    expect(isLoadingStrip(container)).toBe(false);
  });

  test('[ProgressBar-LOAD-001] loading overrides the fill then restores it', async () => {
    // Break this catches: swapping the label during loading or restoring a stale fill/color afterward.
    const { container } = widget.render({
      properties: { progress: binding('{{100}}') },
      styles: { boxShadow: binding(SHADOW) },
    });

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(isLoadingStrip(container)).toBe(true));
    expect(labelNode()).toHaveTextContent('100%');
    expect(widget.exposed().value).toBe(100);
    expect(fill(container)).toHaveStyle({ width: '21%', backgroundColor: PROGRESS });
    expect(canvasNode(container)).toHaveClass('disabled');
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('progress', '{{40}}');
    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(isLoadingStrip(container)).toBe(false));
    expect(labelNode()).toHaveTextContent('40%');
    expect(fill(container)).toHaveStyle({ width: '40%', backgroundColor: PROGRESS });
    expect(canvasNode(container)).not.toHaveClass('disabled');
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test.each(['edit', 'view'])(
    '[ProgressBar-VIS-001] visibility removes the subtree and keeps CSA state in %s mode',
    async (currentMode) => {
      // Break this catches: leaving the fill mounted while hidden, or remounting ProgressBar and wiping CSA value.
      const { container } = widget.render({ currentMode });
      await widget.act('setValue', 62);

      await setProperty('visibility', '{{false}}');
      await waitFor(() => expect(root(container)).toBeNull());
      expect(widget.exposed()).toMatchObject({ value: 62, isVisible: false });

      await setProperty('visibility', '{{true}}');
      await waitFor(() => expect(root(container)).not.toBeNull());
      expect(widget.exposed()).toMatchObject({ value: 62, isVisible: true });
      expect(labelNode()).toHaveTextContent('62%');
      expect(fill(container)).toHaveStyle({ width: '62%' });
    }
  );

  test('[ProgressBar-STY-001] label and bar colors update independently', async () => {
    // Break this catches: wiring a style to the wrong node or keeping completion color below 100.
    const { container } = widget.render();

    await setStyle('textColor', '#8844aa');
    await setStyle('trackColor', '#bbbbbb');
    await setStyle('progressTrackColor', '#00cc66');

    await waitFor(() => expect(labelNode().querySelector('p')).toHaveStyle({ color: '#8844aa' }));
    expect(track(container)).toHaveStyle({ backgroundColor: '#bbbbbb' });
    expect(fill(container)).toHaveStyle({ backgroundColor: '#00cc66' });
    expect(labelNode()).toHaveTextContent('50%');
    expect(widget.exposed().value).toBe(50);

    await setProperty('progress', '{{100}}');
    await waitFor(() => expect(fill(container)).toHaveStyle({ backgroundColor: COMPLETE }));
  });

  test('[ProgressBar-STY-002] alignment, direction, padding and shadow compose across state changes', async () => {
    // Break this catches: dropping a sibling inline style when alignment, loading, or visibility changes.
    const { container } = widget.render({ styles: { boxShadow: binding(SHADOW) } });
    expect(canvasNode(container)).toHaveStyle({ padding: '2px' });
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW, flexDirection: 'row' });

    await setStyle('direction', 'right');
    await waitFor(() => expect(root(container)).toHaveStyle({ flexDirection: 'row-reverse' }));

    await setStyle('alignment', 'top');
    await waitFor(() => expect(root(container)).toHaveStyle({ flexDirection: 'column' }));

    await setStyle('padding', 'none');
    await waitFor(() => expect(canvasNode(container)).toHaveStyle({ padding: '0px' }));

    await setStyle('auto', '{{false}}');
    await setStyle('width', '{{40}}');
    await waitFor(() => expect(labelNode()).toHaveStyle({ width: '40%' }));

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(isLoadingStrip(container)).toBe(true));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('padding', 'default');
    expect(canvasNode(container)).toHaveStyle({ padding: '2px' });
  });

  test('[ProgressBar-GEO-001] in-range size uses authored percent; out-of-range uses 26/20 fallbacks', async () => {
    // Break this catches: using registered defaults 30/20 as the out-of-range fallback, or ignoring authored in-range values.
    const { container } = widget.render();
    expect(labelNode()).toHaveStyle({ fontSize: percentOf(PADDED_HEIGHT, 30) });
    expect(track(container)).toHaveStyle({ height: percentOf(PADDED_HEIGHT, 20) });

    await setStyle('textSize', '{{40}}');
    await setStyle('progressBarThickness', '{{40}}');
    await waitFor(() => expect(labelNode()).toHaveStyle({ fontSize: percentOf(PADDED_HEIGHT, 40) }));
    expect(track(container)).toHaveStyle({ height: percentOf(PADDED_HEIGHT, 40) });

    await setStyle('textSize', '{{51}}');
    await setStyle('progressBarThickness', '{{0}}');
    await waitFor(() => expect(labelNode()).toHaveStyle({ fontSize: percentOf(PADDED_HEIGHT, 26) }));
    expect(track(container)).toHaveStyle({ height: percentOf(PADDED_HEIGHT, 20) });

    await setStyle('padding', 'none');
    await setStyle('textSize', '{{30}}');
    await waitFor(() => expect(labelNode()).toHaveStyle({ fontSize: percentOf(INNER_HEIGHT, 30) }));
  });

  test('[ProgressBar-REG-001] registrations match and new instances seed their value label binding', () => {
    // Break this catches: frontend/server config drift or removing the special new-instance label binding.
    widget.render();
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig.actions.map(({ handle }) => handle)).toEqual(['setValue', 'setVisibility', 'setLoading']);
    expect(frontendConfig.exposedVariables).toEqual({ value: 50, isVisible: true, isLoading: false });
    expect(frontendConfig.actions.map(({ params }) => params[0].handle)).toEqual(['value', 'value', 'loading']);

    const [created] = store().buildComponentDefinition(
      [
        {
          id: 'fresh-bar',
          name: 'freshbar1',
          component: componentTypeDefinitionMap.ProgressBar,
          layouts: { desktop: { top: 0, left: 0, width: 7, height: 50 } },
        },
      ],
      MODULE_ID
    );

    expect(created.component.definition.properties.label).toEqual({
      value: '{{components.fresh-bar.value}}%',
    });
  });

  test('[ProgressBar-ISO-001] instances isolate state and styles', async () => {
    // Break this catches: sharing local state or exposed action handles between widget instances.
    const { container } = widget.render({
      properties: { progress: binding('{{25}}') },
      extraComponents: {
        [ID2]: progressBarDefinition(
          ID2,
          HANDLE2,
          { progress: binding('{{80}}'), labelType: binding('custom'), label: binding('Second') },
          { progressTrackColor: binding('#aa5500'), alignment: binding('top') }
        ),
      },
      also: [{ id: ID2, componentType: 'ProgressBar', widgetHeight: LAYOUT_HEIGHT, widgetWidth: 240 }],
    });

    await waitFor(() => expect(widget.exposed(ID2).value).toBe(80));
    expect(labelNode()).toHaveTextContent('25%');
    expect(labelNode(ID2)).toHaveTextContent('Second');
    expect(root(container, HANDLE2)).toHaveStyle({ flexDirection: 'column' });

    await widget.act('setValue', 40);
    await widget.act('setLoading', true);
    expect(widget.exposed(ID)).toMatchObject({ value: 40, isLoading: true });
    expect(widget.exposed(ID2)).toMatchObject({ value: 80, isLoading: false });
    expect(isLoadingStrip(container)).toBe(true);
    expect(isLoadingStrip(container, HANDLE2)).toBe(false);
    expect(labelNode(ID2)).toHaveTextContent('Second');

    await widget.session.store.act(async () => widget.exposed(ID2).setVisibility(false));
    await waitFor(() => expect(root(container, HANDLE2)).toBeNull());
    expect(root(container)).not.toBeNull();
  });

  test('[ProgressBar-A11Y-001] visible label exists; progressbar semantics stay absent', async () => {
    // Break this catches: dropping the visible label or accidentally adding progressbar ARIA in this backfill.
    const { container } = widget.render();
    expect(labelNode()).toHaveTextContent('50%');
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(root(container)).not.toHaveAttribute('aria-valuenow');
    expect(labelNode()).not.toHaveAttribute('for');

    const viewed = widget.render({ currentMode: 'view' });
    expect(labelNode()).toHaveAttribute('for', `component-${ID}`);
    expect(viewed.container.querySelector('[role="progressbar"]')).toBeNull();
  });
});
