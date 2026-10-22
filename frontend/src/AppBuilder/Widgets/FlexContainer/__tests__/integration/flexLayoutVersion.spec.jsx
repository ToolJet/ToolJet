import React from 'react';
import { act } from '@testing-library/react';
import { FlexContainer } from '@/AppBuilder/Widgets/FlexContainer/FlexContainer';
import { seedApp, componentDefinition } from '@/test/app-builder';
import useStore from '@/AppBuilder/_stores/store';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/widgetHarness';

// A FlexContainer saved before UI 2.0 (no layoutVersion) keeps the lts-3.16 layout in the viewer; one created since
// (layoutVersion '2', from the widget's default definition) gets the new one.
const store = () => useStore.getState();
const V2 = { layoutVersion: '2' };

describe('FlexContainer layout version in the viewer', () => {
  const widget = createWidgetHarness({
    componentType: 'FlexContainer',
    id: 'flex1',
    handle: 'flex1',
    capabilities: { dnd: true },
  });
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  const renderFlex = async (properties, { id = 'flex1', extra = {} } = {}) => {
    await act(async () => {
      seedApp(
        {
          [id]: componentDefinition(id, id, 'FlexContainer', {}, { seedFromRegisteredDefinition: false }),
          ...extra,
        },
        { moduleId: 'canvas' }
      );
      store().setEditorLoading(false, 'canvas');
      store().setCurrentMode('view', 'canvas');
    });
    let view;
    await act(async () => {
      view = widget.session.render(
        <FlexContainer
          id={id}
          properties={{ visibility: true, ...properties }}
          styles={{}}
          width={600}
          height={300}
          currentLayout="desktop"
          currentMode="view"
          setExposedVariable={() => {}}
          setExposedVariables={() => {}}
        />
      );
    });
    return {
      outer: view.container.querySelector('.flex-container-widget'),
      canvas: view.container.querySelector('.real-canvas'),
    };
  };

  describe('a row with Dynamic height off', () => {
    it('keeps its drawn height when saved before layout version 2', async () => {
      const { outer } = await renderFlex({ direction: 'row', dynamicHeight: false });
      expect(outer.style.height).toBe('100%');
    });

    it('fits its content when new', async () => {
      const { outer } = await renderFlex({ ...V2, direction: 'row', dynamicHeight: false });
      expect(outer.style.height).toBe('auto');
    });
  });

  describe('a fixed-height column with Allow wrapping on', () => {
    it('wraps into a second column when saved before layout version 2', async () => {
      const { canvas } = await renderFlex({ direction: 'column', flexWrap: true });
      expect(canvas.style.flexWrap).toBe('wrap');
    });

    it('does not wrap when new', async () => {
      const { canvas } = await renderFlex({ ...V2, direction: 'column', flexWrap: true });
      expect(canvas.style.flexWrap).toBe('nowrap');
    });

    it('a row still wraps either way', async () => {
      expect((await renderFlex({ direction: 'row', flexWrap: true })).canvas.style.flexWrap).toBe('wrap');
      expect((await renderFlex({ ...V2, direction: 'row', flexWrap: true })).canvas.style.flexWrap).toBe('wrap');
    });
  });

  describe('a card in an Equal heights row', () => {
    const inRow = (rowProperties) => {
      const card = componentDefinition('card1', 'card1', 'FlexContainer', { cardStyle: binding('shadcnCard') });
      card.component.parent = 'row1';
      const row = componentDefinition(
        'row1',
        'row1',
        'FlexContainer',
        Object.fromEntries(Object.entries(rowProperties).map(([key, value]) => [key, binding(value)])),
        { seedFromRegisteredDefinition: false }
      );
      return { row1: row, card1: card };
    };

    it("fills the row's height", async () => {
      const { outer } = await renderFlex(
        { direction: 'column', cardStyle: 'shadcnCard' },
        { id: 'card1', extra: inRow({ direction: 'row', equalHeights: '{{true}}' }) }
      );
      expect(outer).toHaveStyle({ minHeight: '100%' });
    });

    it('keeps its own height when Equal heights is off', async () => {
      const { outer } = await renderFlex(
        { direction: 'column', cardStyle: 'shadcnCard' },
        { id: 'card1', extra: inRow({ direction: 'row', equalHeights: '{{false}}' }) }
      );
      expect(outer.style.minHeight).toBe('');
    });
  });
});
