import React from 'react';
import { act } from '@testing-library/react';
import { FlexContainer } from '@/AppBuilder/Widgets/FlexContainer/FlexContainer';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { seedApp, componentDefinition } from '@/test/app-builder';
import useStore from '@/AppBuilder/_stores/store';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/widgetHarness';

// A card in a row whose Align is Stretch fills the row's height. Inside a module, the parent row must be read from
// the module: it was read from the main canvas, where a component with the same id can be a plain column.
const MODULE_ID = 'module-1';
const store = () => useStore.getState();
const SLICES = [
  'initializeComponentsSlice',
  'initializeAppSlice',
  'initializeEventsSlice',
  'initializeResolvedSlice',
  'initializeDependencySlice',
  'initializeDataQuerySlice',
  'initializeModeSlice',
  'initializeLoaderSlice',
];

describe('a FlexContainer card in a module', () => {
  const widget = createWidgetHarness({
    componentType: 'FlexContainer',
    id: 'card1',
    handle: 'card1',
    capabilities: { dnd: true },
  });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  it('stretches to its own row, not to a same-id component on the main canvas', async () => {
    const card = componentDefinition('card1', 'card1', 'FlexContainer', { cardStyle: binding('shadcnCard') });
    card.component.parent = 'row1';
    const row = (direction, alignItems) =>
      componentDefinition('row1', 'row1', 'FlexContainer', {
        direction: binding(direction),
        alignItems: binding(alignItems),
      });
    await act(async () => {
      SLICES.forEach((initialize) => store()[initialize](MODULE_ID));
      seedApp({ row1: row('column', 'flex-start') }, { moduleId: 'canvas' });
      seedApp({ row1: row('row', 'stretch'), card1: card }, { moduleId: MODULE_ID });
      store().setEditorLoading(false, MODULE_ID);
      store().setCurrentMode('view', MODULE_ID);
    });

    let view;
    await act(async () => {
      view = widget.session.render(
        <ModuleProvider moduleId={MODULE_ID} isModuleMode>
          <FlexContainer
            id="card1"
            properties={{ visibility: true, direction: 'column', cardStyle: 'shadcnCard' }}
            styles={{}}
            width={300}
            height={100}
            currentLayout="desktop"
            currentMode="view"
            setExposedVariable={() => {}}
            setExposedVariables={() => {}}
          />
        </ModuleProvider>
      );
    });
    expect(view.container.querySelector('.flex-container-widget')).toHaveStyle({ minHeight: '100%' });
  });
});
