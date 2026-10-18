/**
 * Image module parity: what `imageExposure` computes is what the mounted Image exposes, on its own and in ListView rows.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  drain,
  store,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { imageExposure } from '../../Image';

const widget = createWidgetHarness({
  componentType: 'Image',
  handle: 'image1',
  id: 'img1',
  widgetHeight: 240,
  // jsdom lays nothing out, so LazyLoad would see the standalone image as hidden and never draw it.
  offsetHeight: 240,
  defaultProperties: {
    imageFormat: binding('imageUrl'),
    source: binding('https://example.com/a.svg'),
    alternativeText: binding(''),
    zoomButtons: binding('{{false}}'),
    rotateButton: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    visibility: binding('{{true}}'),
  },
  defaultStyles: { padding: binding('default') },
});

/** Exposed values without functions, and without the `id` RenderWidget adds. */
const values = (exposed) =>
  Object.fromEntries(
    Object.entries(exposed ?? {}).filter(([key, value]) => key !== 'id' && typeof value !== 'function')
  );

/** The module's input from the store, shaped as RenderWidget passes it to the widget. */
const inputOf = (id, index = null) => {
  const resolved = store().getResolvedComponent(id, index, MODULE_ID);
  return {
    properties: { ...resolved.general, ...resolved.properties },
    styles: { ...resolved.generalStyles, ...resolved.styles },
    general: resolved.general,
    validation: resolved.validation,
  };
};

/** What the drawn widget shows (its sourceURL, visibility, isLoading and isDisabled state), read from the DOM. */
const drawn = () => {
  const wrapper = document.querySelector('.image-widget-wrapper');
  const img = wrapper?.querySelector('img.zoom-image-wrap');
  return {
    imageURL: img ? (img.getAttribute('src') ?? '') : undefined,
    isVisible: !!wrapper && wrapper.style.display !== 'none',
    isLoading: !!wrapper?.querySelector('.broken-url-placeholder center'),
    isDisabled: wrapper?.dataset.disabled,
  };
};

/** What `drawn()` should read for these exposed values; the image is not drawn while loading. */
const drawnOf = ({ imageURL, isVisible, isLoading, isDisabled }) => ({
  imageURL: isLoading ? undefined : String(imageURL),
  isVisible: !!isVisible,
  isLoading: !!isLoading,
  isDisabled: isDisabled === undefined ? undefined : String(isDisabled),
});

const mounted = async () => {
  await waitFor(() => expect(widget.exposed().setImageURL).toBeInstanceOf(Function));
  await drain();
};

describe('Image module parity', () => {
  // The editor's scroll container, which the standalone image's LazyLoad listens on; without it the image crashes.
  beforeEach(() => {
    document.body.appendChild(Object.assign(document.createElement('div'), { className: 'canvas-container' }));
    return widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    document.querySelector('.canvas-container')?.remove();
  });

  const cases = {
    defaults: {},
    'JS object image': {
      imageFormat: binding('jsObject'),
      jsSchema: binding("{{{ name: 'a', type: 'image/png', sizeBytes: 3, base64Data: 'AAA' }}}"),
    },
    'JS object image without a schema': { imageFormat: binding('jsObject') },
    'JS object image with a non-object schema': { imageFormat: binding('jsObject'), jsSchema: binding('{{42}}') },
    'non-string source and alternative text': { source: binding('{{123}}'), alternativeText: binding('{{42}}') },
    'alternative text set': { alternativeText: binding('a picture') },
    'hidden, loading and disabled': {
      visibility: binding('{{false}}'),
      loadingState: binding('{{true}}'),
      disabledState: binding('{{true}}'),
    },
    'state flags as plain strings': {
      visibility: binding('false'),
      loadingState: binding('true'),
      disabledState: binding('1'),
    },
    'state flags missing': { visibility: undefined, loadingState: undefined, disabledState: undefined },
  };

  test.each(Object.entries(cases))('initial() matches the mounted widget: %s', async (_, properties) => {
    widget.render({ properties });
    await mounted();
    const initial = imageExposure.initial(inputOf('img1'));
    expect(values(widget.exposed())).toStrictEqual(initial);
    expect(drawn()).toStrictEqual(drawnOf(initial));
  });

  const actionCases = [
    ['setImageURL', ['https://example.com/b.png']],
    ['setImageURL', [42]],
    ['clearImage', []],
    ['setVisibility', [false]],
    ['setVisibility', ['yes']],
    ['setLoading', [1]],
    ['setLoading', [true]],
    ['setDisable', [true]],
    ['setDisable', ['']],
  ];

  test.each(actionCases)('actions.%s(%p) matches the mounted widget', async (name, args) => {
    widget.render({ properties: { alternativeText: binding('alt') } });
    await mounted();
    const before = values(widget.exposed());
    const input = inputOf('img1');
    await widget.act(name, ...args);
    await drain();
    const after = { ...before, ...imageExposure.actions[name](before, args, input) };
    expect(values(widget.exposed())).toStrictEqual(after);
    expect(drawn()).toStrictEqual(drawnOf(after));
  });

  test('state actions are all in actions, none live', () => {
    expect(imageExposure.liveActions).toEqual([]);
    expect(Object.keys(imageExposure.actions).sort()).toEqual(
      ['clearImage', 'setDisable', 'setImageURL', 'setLoading', 'setVisibility'].sort()
    );
  });
});

describe('Image module parity in ListView rows', () => {
  let session;
  const ROWS = [
    { url: 'https://example.com/0.png', alt: 'zero', hidden: false },
    { url: 'https://example.com/1.png', alt: '', hidden: true },
    { url: 'https://example.com/2.png', alt: 'two', hidden: false },
  ];
  const children = () => store().getExposedValueOfComponent('lv1', MODULE_ID)?.children;

  beforeEach(() => {
    session = new AppBuilderTestSession({
      scenario: defineAppBuilderScenario({
        id: 'image-parity-listview',
        name: 'Image in ListView rows',
        primarySeam: 'rtl',
        surface: 'app-editor',
        edition: 'ce',
        environment: 'development',
        layout: 'desktop',
        version: 'draft',
        transferPath: 'not-applicable',
        access: 'authenticated',
        capabilities: { observers: true, media: { matches: false }, dnd: true },
      }),
    });
  });
  afterEach(widget.teardown);

  test('each row exposes initial() of its own resolved input, and row actions match', async () => {
    store().setVariable('rows', ROWS, MODULE_ID);
    const listview = componentDefinition('lv1', 'listview1', 'Listview', {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{variables.rows}}'),
      mode: binding('list'),
      rowHeight: binding('100'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    });
    const image = componentDefinition('img1', 'image1', 'Image', {
      imageFormat: binding('imageUrl'),
      source: binding('{{listItem.url}}'),
      alternativeText: binding('{{listItem.alt}}'),
      visibility: binding('{{!listItem.hidden}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
    });
    image.component.parent = 'lv1';
    image.component.definition.styles = { padding: binding('default') };
    image.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    seedApp({ lv1: listview, img1: image }, { moduleId: MODULE_ID });
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('view', MODULE_ID);
    session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);

    await waitFor(() => ROWS.forEach((_, i) => expect(children()?.[i]?.image1?.setImageURL).toBeInstanceOf(Function)));
    await drain();

    ROWS.forEach((row, i) => {
      const input = inputOf('img1', i);
      expect(input.properties.source).toBe(row.url);
      expect(values(children()[i].image1)).toStrictEqual(imageExposure.initial(input));
    });

    const before = values(children()[1].image1);
    const others = [0, 2].map((i) => values(children()[i].image1));
    await session.store.act(async () => {
      await children()[1].image1.setImageURL('https://example.com/new.png');
    });
    await drain();
    expect(values(children()[1].image1)).toStrictEqual({
      ...before,
      ...imageExposure.actions.setImageURL(before, ['https://example.com/new.png'], inputOf('img1', 1)),
    });
    expect([0, 2].map((i) => values(children()[i].image1))).toStrictEqual(others);
  });
});
