/**
 * C25-01: a pack Kanban's custom cards each hold a pack Textarea and a pack Button whose onClick runs the
 * control-component action "clear" on the textarea. Clicking card Beta's Clear cleared card Alpha's textarea.
 *
 * The host is right: each card's Textarea registers its own "clear" closure per row (setExposedValuePerRow through
 * RenderWidget), and RenderWidget hands the Button's row index to fireEvent as its 6th argument. The index is lost in
 * eventsSlice.onEvent: a pack event carries isCustomComponentEvent and that branch calls executeActionsForEventId
 * without sourceSubContainerIndex, so getExposedValueOfComponent falls back to row 0 (the first card).
 *
 * Fixed in eventsSlice (core, separate branch fix/pack-event-row-index); carried here so the packs stack has it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const s = () => useStore.getState();
const drain = () => new Promise((r) => setTimeout(r, 0));

const setup = () => {
  const textarea = componentDefinition('ta1', 'textarea1', 'LibraryComponent');
  textarea.component.parent = 'kb1';
  const button = componentDefinition('bt1', 'button1', 'LibraryComponent');
  button.component.parent = 'kb1';
  seedApp({ kb1: componentDefinition('kb1', 'kanban1', 'LibraryComponent'), ta1: textarea, bt1: button });
  s().setEditorLoading(false, 'canvas');
  s().setCurrentMode('edit', 'canvas');
  const clearAlpha = jest.fn();
  const clearBeta = jest.fn();
  s().setExposedValuePerRow('ta1', 'clear', clearAlpha, [0], 'canvas');
  s().setExposedValuePerRow('ta1', 'clear', clearBeta, [1], 'canvas');
  s().eventsSlice.setEvents(
    [
      {
        id: 'evt-1',
        index: 0,
        sourceId: 'bt1',
        name: 'evt-1',
        target: 'component',
        event: {
          eventId: 'onClick',
          actionId: 'control-component',
          componentId: 'ta1',
          componentSpecificActionHandle: 'clear',
          componentSpecificActionParams: [],
        },
      },
    ],
    'canvas'
  );
  return { clearAlpha, clearBeta };
};

describe('control-component from a pack row child targets its own row', () => {
  test('a native-style event from card Beta clears Beta (control: the index is forwarded)', async () => {
    const { clearAlpha, clearBeta } = setup();
    await drain();
    s().eventsSlice.fireEvent('onClick', 'bt1', 'canvas', {}, {}, [1]);
    await drain();
    expect(clearBeta).toHaveBeenCalled();
    expect(clearAlpha).not.toHaveBeenCalled();
  });

  // eventsSlice.js:303-305 drops sourceSubContainerIndex on the isCustomComponentEvent branch.
  test('a pack event (isCustomComponentEvent) from card Beta clears Beta, not Alpha', async () => {
    const { clearAlpha, clearBeta } = setup();
    await drain();
    s().eventsSlice.fireEvent('onClick', 'bt1', 'canvas', {}, { isCustomComponentEvent: true }, [1]);
    await drain();
    expect(clearBeta).toHaveBeenCalled();
    expect(clearAlpha).not.toHaveBeenCalled();
  });
});
