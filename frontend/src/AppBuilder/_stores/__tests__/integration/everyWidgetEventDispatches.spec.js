/**
 * The event dispatcher (eventsSlice.onEvent) runs a widget's handlers only for event names it knows: a name missing
 * from its list is dropped without an error, so every handler wired to that event never runs. Fifteen shadcn pack
 * events were dead that way. This fires every event name any widget config declares (native and pack) through the
 * real store and checks its handler ran.
 */
import useStore from '@/AppBuilder/_stores/store';
import { widgets } from '@/AppBuilder/WidgetManager/configs/widgetConfig';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp } from '@/test/app-builder';

const MODULE_ID = 'canvas';
const scenario = defineAppBuilderScenario({
  id: 'every-widget-event-dispatches',
  name: 'Every widget event name runs its handlers',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {},
});

// Dispatched on their own path, with options a widget passes (the table's action and column buttons, a navigation
// item, the calendar's event and slot): covered by those widgets' own specs.
const OWN_PATH = new Set([
  'onTableActionButtonClicked',
  'OnTableToggleCellChanged',
  'OnTableButtonColumnClicked',
  'onCalendarEventSelect',
  'onCalendarSlotSelect',
]);

const names = [...new Set(widgets.flatMap((w) => Object.keys(w.events || {})).filter((n) => !OWN_PATH.has(n)))].sort();

describe('every event name a widget declares runs its handlers', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario }); // eslint-disable-line no-unused-vars
    seedApp({}, { moduleId: MODULE_ID });
  });

  it.each(names)('%s', async (eventId) => {
    const events = [
      {
        id: `evt-${eventId}`,
        index: 0,
        sourceId: 'src1',
        name: `evt-${eventId}`,
        target: 'component',
        event: { eventId, actionId: 'set-custom-variable', key: 'ran', value: '{{true}}' },
      },
    ];
    await useStore.getState().eventsSlice.onEvent(eventId, events, { customVariables: {} }, 'view', MODULE_ID);
    await new Promise((r) => setTimeout(r, 0));
    const variables = useStore.getState().resolvedStore.modules[MODULE_ID].exposedValues.variables;
    expect(variables.ran).toBe(true);
  });
});
