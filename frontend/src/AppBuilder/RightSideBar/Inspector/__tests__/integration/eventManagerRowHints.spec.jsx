/**
 * An event field in the Inspector is a code editor like any other, so it must know which component
 * it belongs to: that is what gives it `listItem` hints inside a List View row and a working
 * preview. Here the editor is stubbed with a prop recorder — what is under test is what the Event
 * manager hands it, not what the editor does with it.
 */
const recorded = [];
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: (props) => {
    recorded.push(props);
    return <div data-cy="stub-code-hinter" />;
  },
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { EventManager } from '../../EventManager';

const LV_ID = 'lv1';

const EVENT = {
  id: 'evt-1',
  index: 0,
  sourceId: LV_ID,
  name: 'Record clicked',
  target: 'component',
  event: { eventId: 'onRecordClicked', actionId: 'show-alert', message: 'hi', debounce: '' },
};

const META = { events: { onRecordClicked: { displayName: 'Record clicked' } } };

function componentForInspector() {
  const definition = componentDefinition(LV_ID, 'listview1', 'Listview', { data: binding('{{[]}}') });
  return { id: LV_ID, ...definition };
}

// Rocket's truncating label measures itself; jsdom ships no ResizeObserver.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  recorded.length = 0;
  seedApp({ [LV_ID]: componentDefinition(LV_ID, 'listview1', 'Listview', { data: binding('{{[]}}') }) });
  useStore.setState((state) => {
    state.eventsSlice.module.canvas.events = [EVENT];
  });
});

describe('Event manager fields know which component they belong to', () => {
  test('[Listview-BUG-029] every event code field is given the component id', async () => {
    // Break this catches: handing the editor only `component` and no `componentId`. Both the row
    // context hints and the preview box are gated on `componentId`, so an event field inside a List
    // View offers no `listItem` and shows no preview.
    render(
      <EventManager
        sourceId={LV_ID}
        eventSourceType="component"
        eventMetaDefinition={META}
        component={componentForInspector()}
      />
    );

    const card = await waitFor(() => {
      const node = document.querySelector('[data-cy="event-handler-card"]');
      expect(node).toBeTruthy();
      return node;
    });
    await userEvent.click(card);

    await waitFor(() => expect(recorded.length).toBeGreaterThan(0));
    recorded.forEach((props) => expect(props.componentId).toBe(LV_ID));
  });
});
