// A saved component whose type this build no longer registers (the retired Ant Design widgets on staging apps, a
// widget from a newer ToolJet) draws a quiet box in its slot; the rest of the page renders.
import React from 'react';
import { screen } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';

const MODULE_ID = 'canvas';

const scenario = defineAppBuilderScenario({
  id: 'unavailable-widget',
  name: 'Unregistered widget type',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false } },
});

const props = (id, componentType) => ({
  id,
  componentType,
  moduleId: MODULE_ID,
  currentMode: 'edit',
  currentLayout: 'desktop',
  widgetHeight: 40,
  widgetWidth: 200,
  inCanvas: true,
  darkMode: false,
  onOptionChange: () => {},
  onOptionsChange: () => {},
});

describe('a component of an unregistered type', () => {
  test('draws "This widget is not available" beside widgets that render', async () => {
    const session = new AppBuilderTestSession({ scenario });
    seedApp(
      {
        gone1: componentDefinition('gone1', 'antbutton1', 'AntButton', { text: { value: 'Old' } }),
        txt1: componentDefinition('txt1', 'text1', 'Text', { text: { value: 'still here' } }),
      },
      { moduleId: MODULE_ID }
    );
    const state = useStore.getState();
    state.setEditorLoading(false, MODULE_ID);
    state.setCurrentMode('edit', MODULE_ID);
    session.render(
      <>
        <RenderWidget {...props('gone1', 'AntButton')} />
        <RenderWidget {...props('txt1', 'Text')} />
      </>
    );

    expect(await screen.findByText('This widget is not available')).toBeInTheDocument();
    expect(await screen.findByText('still here')).toBeInTheDocument();
  });
});
