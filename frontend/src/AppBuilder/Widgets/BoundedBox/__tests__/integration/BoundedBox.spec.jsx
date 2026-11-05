import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { boundedBoxConfig as frontendConfig } from '@tooljet/widget-definitions';
import serverWidgets from '../../../../../../../server/src/modules/apps/services/widget-config';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { baseComponentProperties } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';

const ID = 'bbox1';
const HANDLE = 'boundedbox1';
const ID2 = 'bbox2';
const HANDLE2 = 'boundedbox2';
const IMAGE = 'https://example.com/cars.jpg';
const SHADOW = '1px 2px 3px 4px rgba(0, 0, 0, 0.5)';
// Browser geometry boundary: jsdom lays nothing out, so every element measures as a 200x100 box at 0,0.
const RECT = { x: 0, y: 0, left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100 };

const defaultProperties = {
  imageUrl: binding(IMAGE),
  defaultValue: binding('{{[]}}'),
  selector: binding('RECTANGLE'),
  labels: binding("{{['Car', 'Tree', 7]}}"),
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
};

const widget = createWidgetHarness({
  componentType: 'BoundedBox',
  handle: HANDLE,
  id: ID,
  widgetHeight: 300,
  defaultProperties,
});

const root = (container, handle = HANDLE) =>
  container.querySelector(`[data-cy="draggable-widget-${handle}"] .bounded-box`);
const image = (container, handle) => root(container, handle).querySelector('img');
// react-image-annotation's pointer target is the third child of its container: img, items, target.
const target = (container, handle) => image(container, handle).parentElement.children[2];
const annotations = (id = ID) => widget.exposed(id).annotations;
const variables = () => widget.variables();

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, property, value, 'properties'));
}

async function loadImage(container, handle) {
  fireEvent.load(image(container, handle));
}

function drawRectangle(container, handle, [x1, y1], [x2, y2]) {
  const surface = target(container, handle);
  fireEvent.mouseDown(surface, { clientX: x1, clientY: y1 });
  fireEvent.mouseMove(surface, { clientX: x2, clientY: y2 });
  fireEvent.mouseUp(surface, { clientX: x2, clientY: y2 });
}

async function chooseOption(control, optionText) {
  await widget.session.user.click(control);
  const option = await waitFor(() => {
    const found = Array.from(document.querySelectorAll('[class*="option"]')).find(
      (el) => el.textContent === optionText
    );
    if (!found) throw new Error(`option ${optionText} not open`);
    return found;
  });
  await widget.session.user.click(option);
}

// Counts onChange calls and records how many annotations the handler could see when it ran.
function changeProbes(sourceId = ID, handle = HANDLE, prefix = '') {
  const row = (id, index, key, value) => ({
    id,
    index,
    sourceId,
    name: id,
    target: 'component',
    event: { eventId: 'onChange', actionId: 'set-custom-variable', key, value },
  });
  return [
    row(`${prefix}count`, 0, `${prefix}calls`, `{{(variables.${prefix}calls ?? 0) + 1}}`),
    row(`${prefix}seen`, 1, `${prefix}seen`, `{{components.${handle}.annotations.map((a) => a.text).join(',')}}`),
  ];
}

const twoBoxes =
  "{{[{type: 'RECTANGLE', x: 10, y: 10, width: 20, height: 20, text: 'Car'}, {type: 'RECTANGLE', x: 50, y: 50, width: 20, height: 20, text: 'Tree'}]}}";

function inspectorProps(meta, licensed = true) {
  const component = componentDefinition(ID, HANDLE, 'BoundedBox');
  component.component.properties = meta.properties;
  return {
    componentMeta: meta,
    component,
    paramUpdated: () => {},
    dataQueries: [],
    currentState: {},
    allComponents: {},
    hasCustomStyling: licensed,
  };
}
const controlsOf = (item) =>
  [].concat(item.children?.props?.children ?? item.children).map((el) => [el.props.param.name, el.props.paramType]);

describe('BoundedBox widget', () => {
  let restoreRect;
  beforeEach(async () => {
    const original = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = () => ({ ...RECT, toJSON: () => RECT });
    restoreRect = () => (HTMLElement.prototype.getBoundingClientRect = original);
    await widget.setup();
  });
  afterEach(() => {
    restoreRect();
    widget.teardown();
  });

  test('[BoundedBox-IMG-001] Ready image installs configured rectangle and point defaults', async () => {
    // Break this catches: looking the image up by generated styled-component classes (twice regressed), so defaults never install, or publishing defaults without type/geometry/text/unique ids.
    const { container } = widget.render({
      properties: {
        defaultValue: binding(
          "{{[{type: 'RECTANGLE', x: 10, y: 20, width: 30, height: 40, text: 'Car'}, {type: 'POINT', x: 70, y: 80, width: 0, height: 0, text: 'Tree'}]}}"
        ),
      },
    });
    await loadImage(container);

    await waitFor(() => expect(annotations()).toHaveLength(2));
    const [car, tree] = annotations();
    expect(car).toMatchObject({ type: 'RECTANGLE', x: 10, y: 20, width: 30, height: 40, text: 'Car' });
    expect(tree).toMatchObject({ type: 'POINT', x: 70, y: 80, width: 0, height: 0, text: 'Tree' });
    expect(car.id).toEqual(expect.any(String));
    expect(car.id).not.toBe('');
    expect(car.id).not.toBe(tree.id);
    expect(screen.getAllByText('Car').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tree').length).toBeGreaterThan(0);
  });

  test('[BoundedBox-IMG-002] Property changes deterministically replace or clear annotation state', async () => {
    // Break this catches: unrelated resolutions erasing user annotations, a new default not replacing them, or an invalid default leaving stale annotations published.
    const { container } = widget.render({ properties: { defaultValue: binding(twoBoxes) } });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    const ids = annotations().map((a) => a.id);

    await setProperty('labels', "{{['Car', 'Bus']}}");
    await setProperty('defaultValue', twoBoxes);
    expect(annotations().map((a) => a.id)).toEqual(ids);

    await setProperty('defaultValue', "{{[{type: 'RECTANGLE', x: 5, y: 5, width: 10, height: 10, text: 'Bus'}]}}");
    await waitFor(() => expect(annotations().map((a) => a.text)).toEqual(['Bus']));

    await setProperty('defaultValue', '{{42}}');
    await waitFor(() => expect(annotations()).toEqual([]));
    expect(screen.queryAllByText('Bus', { selector: '[class*="singleValue"]' })).toHaveLength(0);

    await setProperty('defaultValue', "{{[{type: 'RECTANGLE', x: 5, y: 5, width: 10, height: 10, text: 'Car'}]}}");
    await waitFor(() => expect(annotations().map((a) => a.text)).toEqual(['Car']));
    await setProperty('defaultValue', "{{'not annotations'}}");
    await waitFor(() => expect(annotations()).toEqual([]));

    await setProperty('defaultValue', twoBoxes);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    await setProperty('imageUrl', '');
    await waitFor(() => expect(annotations()).toEqual([]));
  });

  test('[BoundedBox-BND-001] Default geometry is normalized without mutating authored input', async () => {
    // Break this catches: clamping the resolver-owned objects in place, or exposing coordinates outside 0..100.
    const authored = Object.freeze([
      Object.freeze({ type: 'RECTANGLE', x: -10, y: 95, width: 30, height: 20, text: 'Car' }),
      Object.freeze({ type: 'RECTANGLE', x: 40, y: -5, width: 150, height: -3, text: 'Tree' }),
    ]);
    const snapshot = JSON.parse(JSON.stringify(authored));
    const { container } = widget.render({
      properties: { defaultValue: binding('{{variables.boxes}}') },
      afterSeed: () => store().setVariable('boxes', authored, MODULE_ID),
    });
    await loadImage(container);

    await waitFor(() => expect(annotations()).toHaveLength(2));
    const [car, tree] = annotations();
    expect(car).toMatchObject({ x: 0, y: 80, width: 30, height: 20 });
    expect(tree).toMatchObject({ x: 40, y: 0, width: 60, height: 0 });
    expect(JSON.parse(JSON.stringify(authored))).toEqual(snapshot);
  });

  test('[BoundedBox-SEL-001] Selector changes choose rectangle, point, and fallback creation behavior', async () => {
    // Break this catches: ignoring live selector changes or crashing on an unsupported selector.
    const { container } = widget.render();
    await loadImage(container);

    drawRectangle(container, undefined, [20, 10], [100, 60]);
    await chooseOption(await screen.findByRole('combobox'), 'Car');
    await waitFor(() => expect(annotations()).toHaveLength(1));
    expect(annotations()[0]).toMatchObject({ type: 'RECTANGLE', x: 10, y: 10, width: 40, height: 50, text: 'Car' });

    await setProperty('selector', 'POINT');
    fireEvent.click(target(container), { clientX: 150, clientY: 30 });
    const editors = await screen.findAllByRole('combobox');
    await chooseOption(editors[editors.length - 1], 'Tree');
    await waitFor(() => expect(annotations()).toHaveLength(2));
    expect(annotations()[1]).toMatchObject({ type: 'POINT', x: 75, y: 30, width: 0, height: 0, text: 'Tree' });

    await setProperty('selector', 'TRIANGLE');
    drawRectangle(container, undefined, [0, 0], [40, 20]);
    const fallback = await screen.findAllByRole('combobox');
    await chooseOption(fallback[fallback.length - 1], 'Car');
    await waitFor(() => expect(annotations()).toHaveLength(3));
    expect(annotations()[2]).toMatchObject({ type: 'RECTANGLE', x: 0, y: 0, width: 20, height: 20 });
  });

  test('[BoundedBox-LBL-001] Label options update safely for strings, numbers, and invalid collections', async () => {
    // Break this catches: dropping numeric labels, keeping stale options after a labels change, crashing on object labels, or rendering a label as markup.
    const { container } = widget.render({
      properties: { labels: binding("{{['Car', 7, '<img src=x onerror=alert(1)>', {a: 1}]}}") },
    });
    await loadImage(container);
    drawRectangle(container, undefined, [20, 10], [100, 60]);
    const editor = await screen.findByRole('combobox');
    await widget.session.user.click(editor);
    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
    await widget.session.user.click(screen.getByText('7'));
    await waitFor(() => expect(annotations()).toHaveLength(1));
    expect(annotations()[0].text).toBe(7);

    await setProperty('labels', "{{['Bus']}}");
    const relabel = (await screen.findAllByRole('combobox'))[0];
    await widget.session.user.click(relabel);
    await waitFor(() => expect(screen.getByText('Bus')).toBeInTheDocument());
    expect(screen.queryByText('Car')).toBeNull();

    await setProperty('labels', "{{'Car'}}");
    drawRectangle(container, undefined, [120, 10], [160, 60]);
    const editors = await screen.findAllByRole('combobox');
    await widget.session.user.click(editors[editors.length - 1]);
    expect(screen.queryByText('Car')).toBeNull();
    expect(screen.getByText(/no options/i)).toBeInTheDocument();
  });

  test('[BoundedBox-EVT-001] Creating a labelled annotation publishes state before one change event', async () => {
    // Break this catches: firing onChange when the empty editor opens, firing before `annotations` is published, or firing more than once per committed annotation.
    const { container } = widget.render({ events: changeProbes() });
    await loadImage(container);

    drawRectangle(container, undefined, [20, 10], [100, 60]);
    const editor = await screen.findByRole('combobox');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(variables().calls).toBeUndefined();

    await chooseOption(editor, 'Car');
    await waitFor(() => expect(variables().calls).toBe(1));
    expect(variables().seen).toBe('Car');
    expect(annotations()).toEqual([expect.objectContaining({ text: 'Car', id: expect.any(String) })]);
  });

  test('[BoundedBox-EVT-002] Relabelling updates only the target before one change event', async () => {
    // Break this catches: relabelling every annotation, regenerating ids, or a stale/duplicate event.
    const { container } = widget.render({ properties: { defaultValue: binding(twoBoxes) }, events: changeProbes() });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    const before = annotations();

    await chooseOption(screen.getByRole('combobox', { name: 'Label for annotation 2' }), 'Car');
    await waitFor(() => expect(variables().calls).toBe(1));
    expect(variables().seen).toBe('Car,Car');
    expect(annotations()).toEqual([before[0], { ...before[1], text: 'Car' }]);
  });

  test('[BoundedBox-EVT-003] Deleting updates only the target before one change event', async () => {
    // Break this catches: deleting the wrong annotation, leaving it exposed, or a stale/duplicate event.
    const { container } = widget.render({ properties: { defaultValue: binding(twoBoxes) }, events: changeProbes() });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    const before = annotations();

    await widget.session.user.click(screen.getByRole('button', { name: 'Delete annotation 1' }));
    await waitFor(() => expect(variables().calls).toBe(1));
    expect(variables().seen).toBe('Tree');
    expect(annotations()).toEqual([before[1]]);
  });

  test('[BoundedBox-VIS-001] Visibility hides and restores the same annotations', async () => {
    // Break this catches: resetting or regenerating annotations when the widget is hidden and shown.
    const { container } = widget.render({ properties: { defaultValue: binding(twoBoxes) } });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    const before = annotations();

    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(annotations()).toEqual(before);

    await setProperty('visibility', true);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'block' }));
    expect(annotations()).toEqual(before);
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  test('[BoundedBox-VIS-002] Visibility, Disable and Collapse when hidden are Properties under Additional Actions', async () => {
    // Break this catches: leaving the keys in Styles (so migrated `properties` values are ignored) or keeping BoundedBox out of Additional Actions, which hides Collapse when hidden.
    const meta = componentTypeDefinitionMap.BoundedBox;
    const keys = Object.keys(meta.properties);
    const section = (key) => meta.properties[key]?.section;
    const { component } = inspectorProps(meta);
    const accordions = baseComponentProperties(
      keys.filter((key) => section(key) !== 'additionalActions'),
      Object.keys(meta.events),
      component,
      meta,
      () => {},
      () => {},
      [],
      {},
      () => {},
      [],
      {},
      [],
      false,
      [],
      keys.filter((key) => section(key) === 'additionalActions'),
      ID
    );
    expect(accordions.map((item) => item.title)).not.toContain('General');
    expect(controlsOf(accordions.find((item) => item.title === 'Additional Actions'))).toEqual([
      ['visibility', 'properties'],
      ['collapseWhenHidden', 'properties'],
      ['disabledState', 'properties'],
      ['tooltipFormat', 'properties'],
      ['tooltip', 'properties'],
    ]);
    expect(meta.properties.visibility.validation.defaultValue).toBe(true);
    expect(Object.keys(meta.styles)).not.toEqual(expect.arrayContaining(['visibility']));
    expect(Object.keys(meta.styles)).not.toEqual(expect.arrayContaining(['disabledState']));
    expect(serverWidgets.boundedBoxConfig).toEqual(frontendConfig);
    expect(frontendConfig.actions).toEqual([]);

    const { container } = widget.render({
      properties: { visibility: binding('{{false}}') },
      styles: { visibility: binding('{{true}}') },
    });
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
  });

  test('[BoundedBox-DIS-001] Disabled state prevents every annotation mutation', async () => {
    // Break this catches: a Disable that only stops drawing while relabel/delete still change the data.
    const { container } = widget.render({
      properties: { defaultValue: binding(twoBoxes), disabledState: binding('{{true}}') },
      events: changeProbes(),
    });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));
    const before = annotations();

    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    const remove = screen.getByRole('button', { name: 'Delete annotation 1' });
    expect(remove).toBeDisabled();
    fireEvent.click(remove);
    // react-select hides a disabled input (visibility: hidden), so it leaves the accessibility tree.
    const label = screen.getByLabelText('Label for annotation 2');
    expect(label).toBeDisabled();
    drawRectangle(container, undefined, [20, 10], [100, 60]);
    expect(screen.queryByRole('combobox', { name: 'Label for new annotation' })).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(annotations()).toEqual(before);
    expect(variables().calls).toBeUndefined();

    await setProperty('disabledState', false);
    await waitFor(() => expect(root(container)).not.toHaveAttribute('aria-disabled', 'true'));
    await widget.session.user.click(screen.getByRole('button', { name: 'Delete annotation 1' }));
    await waitFor(() => expect(annotations()).toEqual([before[1]]));
    await chooseOption(screen.getByRole('combobox', { name: 'Label for annotation 1' }), 'Car');
    await waitFor(() => expect(annotations()[0].text).toBe('Car'));
    drawRectangle(container, undefined, [20, 10], [100, 60]);
    await chooseOption(await screen.findByRole('combobox', { name: 'Label for new annotation' }), 'Tree');
    await waitFor(() => expect(annotations()).toHaveLength(2));
    expect(variables().calls).toBe(3);
  });

  test('[BoundedBox-STY-001] Box shadow survives independent state changes', async () => {
    // Break this catches: rebuilding root styles without the merged generalStyles boxShadow.
    const { container } = widget.render({
      afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', SHADOW, 'generalStyles'),
    });
    await waitFor(() => expect(root(container)).toHaveStyle({ boxShadow: SHADOW }));

    await setProperty('disabledState', true);
    await waitFor(() => expect(root(container)).toHaveAttribute('aria-disabled', 'true'));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    await setProperty('visibility', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'none' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
    await setProperty('visibility', true);
    await setProperty('disabledState', false);
    await waitFor(() => expect(root(container)).toHaveStyle({ display: 'block' }));
    expect(root(container)).toHaveStyle({ boxShadow: SHADOW });
  });

  test('[BoundedBox-ISO-001] Instances isolate image readiness, annotations, IDs, and events', async () => {
    // Break this catches: a document-wide image lookup installing one instance's defaults on load of the other, or one instance's edits/events leaking into the other.
    const second = componentDefinition(ID2, HANDLE2, 'BoundedBox', {
      ...defaultProperties,
      defaultValue: binding("{{[{type: 'RECTANGLE', x: 60, y: 60, width: 10, height: 10, text: 'Tree'}]}}"),
    });
    const { container } = widget.render({
      properties: { defaultValue: binding(twoBoxes) },
      extraComponents: { [ID2]: second },
      also: [{ id: ID2, componentType: 'BoundedBox', widgetHeight: 300 }],
      events: [...changeProbes(), ...changeProbes(ID2, HANDLE2, 'b')],
    });

    await loadImage(container, HANDLE2);
    await waitFor(() => expect(annotations(ID2)).toHaveLength(1));
    expect(annotations(ID).some((a) => a.x === 10 && a.text === 'Car')).toBe(false);

    await loadImage(container, HANDLE);
    await waitFor(() => expect(annotations(ID)).toHaveLength(2));
    const ids = [...annotations(ID), ...annotations(ID2)].map((a) => a.id);
    expect(new Set(ids).size).toBe(3);
    const secondBefore = annotations(ID2);

    const first = within(root(container, HANDLE));
    await widget.session.user.click(first.getByRole('button', { name: 'Delete annotation 1' }));
    await waitFor(() => expect(variables().calls).toBe(1));
    expect(annotations(ID)).toHaveLength(1);
    expect(annotations(ID2)).toEqual(secondBefore);
    expect(variables().bcalls).toBeUndefined();
  });

  test('[BoundedBox-ACC-001] Annotation content and controls expose useful semantics', async () => {
    // Break this catches: an unnamed image, unnamed label selects, or a click-only span as delete control.
    const { container } = widget.render({ properties: { defaultValue: binding(twoBoxes) } });
    await loadImage(container);
    await waitFor(() => expect(annotations()).toHaveLength(2));

    expect(screen.getByRole('img', { name: 'Image to annotate' })).toBe(image(container));
    expect(screen.getByRole('combobox', { name: 'Label for annotation 1' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Label for annotation 2' })).toBeInTheDocument();
    const remove = screen.getByRole('button', { name: 'Delete annotation 2' });
    expect(remove.tagName).toBe('BUTTON');
    expect(remove).toHaveAttribute('type', 'button');

    remove.focus();
    await widget.session.user.keyboard('{Enter}');
    await waitFor(() => expect(annotations().map((a) => a.text)).toEqual(['Car']));
  });

  test.each([
    ['plainText', 'Draw <b>cars</b>', () => screen.getAllByText('Draw <b>cars</b>')],
    ['html', 'Draw <b>cars</b>', () => screen.getAllByText('cars', { selector: 'b' })],
  ])('[BoundedBox-TOOLTIP-001] Tooltip renders in %s format from properties', async (format, text, find) => {
    // Break this catches: reading the BoundedBox tooltip from `general`, where nothing writes it any more, or ignoring the chosen format.
    widget.render({
      properties: { tooltip: binding(text), tooltipFormat: binding(format) },
      afterSeed: () => widget.setComponentProperty(ID, 'tooltip', 'stale general tooltip', 'general'),
    });
    await widget.session.user.hover(document.querySelector(`[data-cy="draggable-widget-${HANDLE}"]`));
    await waitFor(() => expect(find().length).toBeGreaterThan(0));
    expect(screen.queryByText('stale general tooltip')).toBeNull();
  });

  test.each([
    [true, true],
    [false, false],
  ])('[BoundedBox-CSS-001] CSS class sits in a Styles "Advanced" section (licensed: %s)', (licensed, shown) => {
    // Break this catches: rendering CSS class as a flat Styles control, or showing it without the license.
    const props = inspectorProps(componentTypeDefinitionMap.BoundedBox, licensed);
    const flat = [].concat(Inspector.RenderStyleOptions(props) ?? []).map((el) => el?.props?.param?.name);
    expect(flat).not.toContain('cssClass');

    const advanced = Inspector.RenderLegacyAdvancedStyles(props);
    if (!shown) {
      expect(advanced).toBeNull();
      return;
    }
    const [sectionItem] = advanced.props.items;
    expect(sectionItem.title).toBe('Advanced');
    expect(controlsOf(sectionItem)).toEqual([['cssClass', 'styles']]);
  });
});
