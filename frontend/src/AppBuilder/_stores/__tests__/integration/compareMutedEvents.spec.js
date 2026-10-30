/**
 * The compare view opens a dialog in its read-only frames to show a change inside it
 * (Viewer/useCompareOverlayBridge.js). That dialog's own events must not run the app's actions there.
 * Runs against the real composed store, like eventActions.spec.js.
 */
import useStore from '@/AppBuilder/_stores/store';
import { muteCompareEvents } from '@/AppBuilder/_utils/compareFrame';

const s = () => useStore.getState();
const drain = () => new Promise((r) => setTimeout(r, 0));
const variables = () => s().resolvedStore.modules.canvas.exposedValues.variables;

const onOpen = (sourceId, value) => ({
  id: `evt-${sourceId}`,
  index: 0,
  sourceId,
  name: `evt-${sourceId}`,
  target: 'component',
  event: { eventId: 'onOpen', actionId: 'set-custom-variable', key: sourceId, value },
});

describe('events of a dialog the compare view opened', () => {
  test('are muted for that dialog only', async () => {
    s().setEditorLoading(false, 'canvas');
    s().setCurrentMode('view', 'canvas');
    s().eventsSlice.setEvents([onOpen('compareDialog', 'RAN'), onOpen('otherDialog', 'RAN')], 'canvas');

    muteCompareEvents('compareDialog');
    s().eventsSlice.fireEvent('onOpen', 'compareDialog', 'canvas', {}, {});
    s().eventsSlice.fireEvent('onOpen', 'otherDialog', 'canvas', {}, {});
    await drain();

    expect(variables().compareDialog).toBeUndefined();
    expect(variables().otherDialog).toBe('RAN');
  });
});
