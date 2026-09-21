import { waitFor, within } from '@testing-library/react';
import { circularProgressbarConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/circularProgressbar';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';
import { circularProgressbarConfig as serverConfig } from '../../../../../../server/src/modules/apps/services/widget-config/circularProgressbar';

const ID = 'circle1';
const HANDLE = 'circularprogressbar1';
const ID2 = 'circle2';
const HANDLE2 = 'circularprogressbar2';
const POSITIVE = '#3366ff';
const NEGATIVE = '#cc0000';
const COMPLETE = '#008844';
const TRACK = '#dddddd';
const TEXT = '#222222';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
const STROKE_WIDTH = 10;

const defaultProperties = {
  labelType: binding('auto'),
  text: binding(''),
  allowNegativeProgress: binding('{{false}}'),
  progress: binding('{{50}}'),
  loadingState: binding('{{false}}'),
  visibility: binding('{{true}}'),
};

const defaultStyles = {
  textColor: binding(TEXT),
  textSize: binding('{{16}}'),
  trackColor: binding(TRACK),
  color: binding(POSITIVE),
  negativeColor: binding(NEGATIVE),
  completionColor: binding(COMPLETE),
  strokeWidth: binding(`{{${STROKE_WIDTH}}}`),
  circleRatio: binding('{{1}}'),
  alignment: binding('center'),
  counterClockwise: binding('{{false}}'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  padding: binding('default'),
};

const widget = createWidgetHarness({
  componentType: 'CircularProgressBar',
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
  widgetHeight: 100,
  widgetWidth: 200,
});

const root = (container, handle = HANDLE) => container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) => container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const inner = (container, handle = HANDLE) => root(container, handle)?.firstElementChild;
const svg = (container, handle = HANDLE) =>
  root(container, handle)?.querySelector('[data-test-id="CircularProgressbar"]');
const path = (container, handle = HANDLE) => root(container, handle)?.querySelector('.CircularProgressbar-path');
const trail = (container, handle = HANDLE) => root(container, handle)?.querySelector('.CircularProgressbar-trail');
const label = (container, handle = HANDLE) => root(container, handle)?.querySelector('.CircularProgressbar-text');
const dashOffset = (node) => Number.parseFloat(node.style.strokeDashoffset);
const circumference = (strokeWidth = STROKE_WIDTH) => 2 * Math.PI * (50 - strokeWidth / 2);

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}

async function setStyle(style, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, style, value, 'styles'));
}

function circularDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, 'CircularProgressBar', {
    ...defaultProperties,
    ...properties,
  });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

describe('CircularProgressBar widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[CircularProgressBar-DEF-001] default widget renders 50% and publishes its initial state', async () => {
    // Break this catches: seeding the wrong value/state or disconnecting the label from the initial progress.
    const { container } = widget.render();

    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        value: 50,
        isVisible: true,
        isLoading: false,
      })
    );
    expect(label(container)).toHaveTextContent('50%');
    expect(dashOffset(path(container))).toBeCloseTo(circumference() / 2, 4);
    expect(root(container)).toHaveStyle({ display: 'flex' });
    expect(inner(container)).not.toHaveClass('rotate-forever');
  });

  test('[CircularProgressBar-LBL-001] Auto and Custom labels follow their own sources', async () => {
    // Break this catches: using authored text in Auto mode or replacing a Custom label when value changes.
    const { container } = widget.render();

    await setProperty('progress', '{{64}}');
    await waitFor(() => expect(label(container)).toHaveTextContent('64%'));

    await setProperty('labelType', 'custom');
    await setProperty('text', '<b>Ready</b>');
    await waitFor(() => expect(label(container)).toHaveTextContent('<b>Ready</b>'));
    expect(label(container).querySelector('b')).toBeNull();

    await widget.act('setValue', 72);
    expect(label(container)).toHaveTextContent('<b>Ready</b>');

    await setProperty('text', '');
    await waitFor(() => expect(label(container)).toBeNull());
  });

  test('[CircularProgressBar-VAL-001] progress updates path, label and exposed value without remounting', async () => {
    // Break this catches: updating only the exposed value while leaving the rendered path or Auto label stale.
    const { container } = widget.render();
    const initialSvg = svg(container);

    await setProperty('progress', '{{75}}');

    await waitFor(() => expect(widget.exposed().value).toBe(75));
    expect(label(container)).toHaveTextContent('75%');
    expect(dashOffset(path(container))).toBeCloseTo(circumference() * 0.25, 4);
    expect(svg(container)).toBe(initialSvg);
  });

  test('[CircularProgressBar-BND-001] negative and completion boundaries preserve raw state and cap the path', async () => {
    // Break this catches: clamping the public value, using the wrong boundary color, or failing to reverse negative progress.
    const { container } = widget.render();

    await setProperty('progress', '{{-40}}');
    await waitFor(() => expect(widget.exposed().value).toBe(-40));
    expect(label(container)).toHaveTextContent('-40%');
    expect(dashOffset(path(container))).toBeCloseTo(circumference(), 4);
    expect(path(container)).toHaveStyle({ stroke: POSITIVE });

    await setProperty('allowNegativeProgress', '{{true}}');
    await waitFor(() => expect(path(container)).toHaveStyle({ stroke: NEGATIVE }));
    expect(widget.exposed().value).toBe(-40);
    expect(label(container)).toHaveTextContent('-40%');
    expect(dashOffset(path(container))).toBeCloseTo(-circumference() * 0.6, 4);

    await setProperty('progress', '{{100}}');
    await waitFor(() => expect(path(container)).toHaveStyle({ stroke: COMPLETE }));
    expect(dashOffset(path(container))).toBeCloseTo(0, 4);

    await setProperty('progress', '{{150}}');
    await waitFor(() => expect(widget.exposed().value).toBe(150));
    expect(label(container)).toHaveTextContent('150%');
    expect(path(container)).toHaveStyle({ stroke: COMPLETE });
    expect(dashOffset(path(container))).toBeCloseTo(0, 4);
  });

  test('[CircularProgressBar-ACT-001] registered actions update presentation and exposed state', async () => {
    // Break this catches: publishing action state without re-rendering the widget, or exposing a non-callable handle.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().setValue).toBeInstanceOf(Function));
    expect(widget.exposed().setVisibility).toBeInstanceOf(Function);
    expect(widget.exposed().setLoading).toBeInstanceOf(Function);

    await widget.act('setValue', 35);
    expect(widget.exposed().value).toBe(35);
    expect(label(container)).toHaveTextContent('35%');

    await widget.act('setVisibility', false);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveStyle({ display: 'none' });

    await widget.act('setVisibility', true);
    await widget.act('setLoading', true);
    expect(widget.exposed()).toMatchObject({
      isVisible: true,
      isLoading: true,
    });
    expect(root(container)).toHaveStyle({ display: 'flex' });
    expect(inner(container)).toHaveClass('rotate-forever');
  });

  test('[CircularProgressBar-PREC-001] actions survive no-op resolution and yield to changed matching properties', async () => {
    // Break this catches: syncing properties on every render and silently undoing CSA state.
    const { container } = widget.render();

    await widget.act('setValue', 70);
    await widget.act('setVisibility', false);
    await widget.act('setLoading', true);
    await setStyle('alignment', 'flex-start');
    await setProperty('progress', '{{50}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('loadingState', '{{false}}');

    expect(widget.exposed()).toMatchObject({
      value: 70,
      isVisible: false,
      isLoading: true,
    });
    expect(root(container)).toHaveStyle({ display: 'none' });
    expect(inner(container)).toHaveClass('rotate-forever');

    await setProperty('progress', '{{80}}');
    await setProperty('visibility', '{{false}}');
    await setProperty('loadingState', '{{true}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('loadingState', '{{false}}');

    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        value: 80,
        isVisible: true,
        isLoading: false,
      })
    );
    expect(label(container)).toHaveTextContent('80%');
    expect(root(container)).toHaveStyle({ display: 'flex' });
    expect(inner(container)).not.toHaveClass('rotate-forever');
  });

  test('[CircularProgressBar-LOAD-001] loading overrides and restores the latest progress presentation', async () => {
    // Break this catches: rotating the shadowed outer node or restoring stale value/style state after loading.
    const { container } = widget.render({
      properties: {
        labelType: binding('custom'),
        text: binding('Ready'),
        progress: binding('{{64}}'),
      },
      styles: { circleRatio: binding('{{0.7}}'), boxShadow: binding(SHADOW) },
    });

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(inner(container)).toHaveClass('rotate-forever'));
    expect(root(container)).not.toHaveClass('rotate-forever');
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    expect(label(container)).toHaveTextContent(/^\s*$/);
    expect(dashOffset(trail(container))).toBeCloseTo(0, 4);
    expect(dashOffset(path(container))).toBeCloseTo(circumference() * 0.75, 4);

    await setProperty('progress', '{{72}}');
    await setStyle('circleRatio', '{{0.6}}');
    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(inner(container)).not.toHaveClass('rotate-forever'));
    expect(label(container)).toHaveTextContent('Ready');
    expect(widget.exposed()).toMatchObject({ value: 72, isLoading: false });
    expect(dashOffset(trail(container))).toBeCloseTo(circumference() * 0.4, 4);
    expect(dashOffset(path(container))).toBeCloseTo(circumference() * (1 - 0.72 * 0.6), 4);
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test.each(['edit', 'view'])(
    '[CircularProgressBar-VIS-001] visibility hides without unmounting and restores state in %s mode',
    async (currentMode) => {
      // Break this catches: unmounting on hide or applying visibility in only one App Builder mode.
      const { container } = widget.render({
        currentMode,
        styles: { boxShadow: binding(SHADOW) },
      });
      const initialSvg = svg(container);
      await widget.act('setValue', 62);

      await setProperty('visibility', '{{false}}');
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
      expect(svg(container)).toBe(initialSvg);
      expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

      await setProperty('visibility', '{{true}}');
      await waitFor(() => expect(root(container)).toHaveStyle({ display: 'flex' }));
      expect(svg(container)).toBe(initialSvg);
      expect(label(container)).toHaveTextContent('62%');
      expect(widget.exposed()).toMatchObject({ value: 62, isVisible: true });
    }
  );

  test('[CircularProgressBar-STY-001] label and circle colors update independently', async () => {
    // Break this catches: wiring a style to the wrong SVG element or rebuilding styles with a stale value.
    const { container } = widget.render();

    await setStyle('textColor', '#8844aa');
    await setStyle('textSize', '{{22}}');
    await setStyle('trackColor', '#bbbbbb');
    await setStyle('color', '#ff8800');

    await waitFor(() =>
      expect(label(container)).toHaveStyle({
        fill: '#8844aa',
        fontSize: '22px',
      })
    );
    expect(trail(container)).toHaveStyle({ stroke: '#bbbbbb' });
    expect(path(container)).toHaveStyle({ stroke: '#ff8800' });
    expect(label(container)).toHaveTextContent('50%');
    expect(widget.exposed().value).toBe(50);
  });

  test('[CircularProgressBar-STY-002] alignment, padding and shadow compose across state changes', async () => {
    // Break this catches: dropping a sibling inline style when alignment, loading, or visibility changes.
    const { container } = widget.render({
      styles: { boxShadow: binding(SHADOW) },
    });
    expect(canvasNode(container)).toHaveStyle({ padding: '2px' });
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setStyle('alignment', 'flex-start');
    await setStyle('padding', 'none');
    await waitFor(() => expect(inner(container)).toHaveStyle({ justifyContent: 'flex-start' }));
    expect(canvasNode(container)).toHaveStyle({ padding: '0px' });

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(inner(container)).toHaveClass('rotate-forever'));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });

    await setProperty('visibility', '{{false}}');
    await waitFor(() =>
      expect(root(container)).toHaveStyle({
        display: 'none',
        boxShadow: SHADOW,
      })
    );

    await setStyle('padding', 'default');
    expect(canvasNode(container)).toHaveStyle({ padding: '2px' });
  });

  test('[CircularProgressBar-CIR-001] stroke width, ratio and direction update SVG geometry', async () => {
    // Break this catches: forwarding stale geometry props or flipping only the trail instead of the progress path.
    const { container } = widget.render();
    const initialPathOffset = dashOffset(path(container));

    await setStyle('strokeWidth', '{{20}}');
    await waitFor(() => expect(path(container)).toHaveAttribute('stroke-width', '20'));
    expect(trail(container)).toHaveAttribute('stroke-width', '20');

    await setStyle('circleRatio', '{{0.5}}');
    const smallerCircumference = circumference(20);
    await waitFor(() => expect(dashOffset(trail(container))).toBeCloseTo(smallerCircumference * 0.5, 4));
    expect(dashOffset(path(container))).toBeCloseTo(smallerCircumference * 0.75, 4);
    expect(dashOffset(path(container))).not.toBeCloseTo(initialPathOffset, 4);

    await setStyle('counterClockwise', '{{true}}');
    await waitFor(() => expect(dashOffset(path(container))).toBeLessThan(0));
    expect(dashOffset(trail(container))).toBeLessThan(0);
    expect(widget.exposed().value).toBe(50);
    expect(path(container)).toHaveStyle({ stroke: POSITIVE });
  });

  test('[CircularProgressBar-REG-001] registrations match and new instances seed their value label binding', () => {
    // Break this catches: frontend/server config drift or removing the special new-instance text binding.
    widget.render();
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig.actions.map(({ handle }) => handle)).toEqual(['setValue', 'setVisibility', 'setLoading']);
    expect(frontendConfig.exposedVariables).toEqual({
      value: 50,
      isVisible: true,
      isLoading: false,
    });
    expect(frontendConfig.actions.map(({ params }) => params[0].handle)).toEqual(['value', 'value', 'value']);

    const [created] = store().buildComponentDefinition(
      [
        {
          id: 'fresh-circle',
          name: 'freshcircle1',
          component: componentTypeDefinitionMap.CircularProgressBar,
          layouts: { desktop: { top: 0, left: 0, width: 7, height: 50 } },
        },
      ],
      MODULE_ID
    );

    expect(created.component.definition.properties.text).toEqual({
      value: '{{components.fresh-circle.value}}%',
    });
  });

  test('[CircularProgressBar-ISO-001] instances isolate state and styles', async () => {
    // Break this catches: sharing local state or exposed action handles between widget instances.
    const { container } = widget.render({
      properties: { progress: binding('{{25}}') },
      extraComponents: {
        [ID2]: circularDefinition(
          ID2,
          HANDLE2,
          {
            progress: binding('{{80}}'),
            labelType: binding('custom'),
            text: binding('Second'),
          },
          { color: binding('#aa5500'), alignment: binding('flex-end') }
        ),
      },
      also: [
        {
          id: ID2,
          componentType: 'CircularProgressBar',
          widgetHeight: 100,
          widgetWidth: 200,
        },
      ],
    });

    await waitFor(() => expect(widget.exposed(ID2).value).toBe(80));
    expect(label(container)).toHaveTextContent('25%');
    expect(label(container, HANDLE2)).toHaveTextContent('Second');
    expect(inner(container, HANDLE2)).toHaveStyle({
      justifyContent: 'flex-end',
    });

    await widget.act('setValue', 40);
    await widget.act('setLoading', true);
    expect(widget.exposed(ID)).toMatchObject({ value: 40, isLoading: true });
    expect(widget.exposed(ID2)).toMatchObject({ value: 80, isLoading: false });
    expect(inner(container)).toHaveClass('rotate-forever');
    expect(inner(container, HANDLE2)).not.toHaveClass('rotate-forever');
    expect(label(container, HANDLE2)).toHaveTextContent('Second');

    await widget.session.store.act(async () => widget.exposed(ID2).setVisibility(false));
    await waitFor(() => expect(root(container, HANDLE2)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ display: 'flex' });
  });

  test('[CircularProgressBar-A11Y-001] Auto and Custom labels remain visible SVG text', async () => {
    // Break this catches: rendering the label outside the SVG or dropping it during label-mode updates.
    const { container } = widget.render();
    const progressSvg = svg(container);

    expect(within(progressSvg).getByText('50%')).toBe(label(container));

    await setProperty('labelType', 'custom');
    await setProperty('text', 'Three quarters complete');
    await waitFor(() => expect(within(progressSvg).getByText('Three quarters complete')).toBe(label(container)));
  });
});
