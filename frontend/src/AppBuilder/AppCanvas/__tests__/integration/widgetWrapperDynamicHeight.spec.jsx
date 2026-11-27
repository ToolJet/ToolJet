/**
 * The canvas box WidgetWrapper draws for a widget that sizes to its content: in the viewer it is drawn at
 * height: auto, so it follows what the widget draws (dynamicHeightPolicy.boxFollowsContentInView). A container keeps
 * the height the engine works out from its children, and the editor keeps drawing every box at its layout height.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import WidgetWrapper from '@/AppBuilder/AppCanvas/WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import {
  AppBuilderTestSession,
  defineAppBuilderScenario,
  seedApp,
  componentDefinition,
  binding,
} from '@/test/app-builder';

const scenario = defineAppBuilderScenario({
  id: 'widget-wrapper-dynamic-height',
  name: 'Canvas box of a widget that sizes to its content',
  primarySeam: 'rtl',
  surface: 'released-viewer',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'released',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // A Container draws a drop target, so the session needs the real DndProvider.
  capabilities: { observers: true, dnd: true, media: { matches: false } },
});

const DH = { dynamicHeight: binding('{{true}}') };

const seedOne = (id, type, properties) => {
  const definition = componentDefinition(id, id, type, properties);
  definition.layouts = { desktop: { top: 0, left: 0, width: 10, height: 120 } };
  seedApp({ [id]: definition });
};

describe('the canvas box of a widget that sizes to its content', () => {
  let session;
  const renderIn = (mode, id) => {
    const state = useStore.getState();
    state.setEditorLoading(false, 'canvas');
    state.setCurrentMode(mode, 'canvas');
    session.render(
      <WidgetWrapper
        id={id}
        moduleId="canvas"
        mode={mode}
        currentLayout="desktop"
        gridWidth={20}
        inCanvas
        onOptionChange={() => {}}
        onOptionsChange={() => {}}
      />
    );
  };
  const box = (id) => document.querySelector(`.ele-${id}`);

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  it('[DynamicHeight-BOX-001] follows the content of an Html widget in the viewer', async () => {
    seedOne('html1', 'Html', { ...DH, rawHtml: binding('<p>Hello</p>') });
    renderIn('view', 'html1');
    await waitFor(() => expect(box('html1')).toHaveStyle({ height: 'auto' }));
  });

  it('[DynamicHeight-BOX-002] follows the content of a Text widget in the viewer, as before', async () => {
    seedOne('text1', 'Text', { ...DH, text: binding('Hello') });
    renderIn('view', 'text1');
    await waitFor(() => expect(box('text1')).toHaveStyle({ height: 'auto' }));
  });

  it('[DynamicHeight-BOX-003] keeps the layout height with Dynamic height off', async () => {
    seedOne('html1', 'Html', { rawHtml: binding('<p>Hello</p>') });
    renderIn('view', 'html1');
    await waitFor(() => expect(box('html1')).toHaveStyle({ height: '120px' }));
  });

  it('[DynamicHeight-BOX-004] keeps the layout height of a container, which is sized from its children', async () => {
    seedOne('container1', 'Container', DH);
    renderIn('view', 'container1');
    await waitFor(() => expect(box('container1')).toHaveStyle({ height: '120px' }));
  });

  it('[DynamicHeight-BOX-005] keeps the layout height in the editor', async () => {
    seedOne('html1', 'Html', { ...DH, rawHtml: binding('<p>Hello</p>') });
    renderIn('edit', 'html1');
    await waitFor(() => expect(box('html1')).toHaveStyle({ height: '120px' }));
  });
});
