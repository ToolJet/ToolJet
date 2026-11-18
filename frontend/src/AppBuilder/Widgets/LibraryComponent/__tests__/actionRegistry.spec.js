import {
  createActionRegistry,
  isActionRegistrySettled,
  setActionRegistrySettled,
  whenActionRegistered,
} from '@/AppBuilder/Widgets/LibraryComponent/actionRegistry';

// A pack component's action handlers, registered by its ToolJet.useAction calls; an action called before its handler
// is registered waits for it while the component is still loading (QA item 33).
describe('a pack action handler registry', () => {
  afterEach(() => jest.useRealTimers());

  it('gives a registered handler at once', async () => {
    const actions = createActionRegistry();
    const open = () => 'opened';
    actions.set('open', open);
    await expect(whenActionRegistered(actions, 'open', 1000)).resolves.toBe(open);
  });

  it('gives a handler registered later to every caller waiting for it', async () => {
    const actions = createActionRegistry();
    const first = whenActionRegistered(actions, 'open', 1000);
    const second = whenActionRegistered(actions, 'open', 1000);
    const open = () => 'opened';
    actions.set('open', open);
    await expect(first).resolves.toBe(open);
    await expect(second).resolves.toBe(open);
  });

  it('gives nothing once the wait is over, and a later registration still works', async () => {
    jest.useFakeTimers();
    const actions = createActionRegistry();
    const waiting = whenActionRegistered(actions, 'open', 1000);
    jest.advanceTimersByTime(1000);
    await expect(waiting).resolves.toBeUndefined();
    const open = () => 'opened';
    actions.set('open', open);
    expect(actions.get('open')).toBe(open);
  });

  it('stops waiting once the component has drawn without registering it', async () => {
    const actions = createActionRegistry();
    const waiting = whenActionRegistered(actions, 'open', 15000);
    setActionRegistrySettled(actions, true);
    await expect(waiting).resolves.toBeUndefined();
    await expect(whenActionRegistered(actions, 'open', 15000)).resolves.toBeUndefined();
  });

  it('waits again once the component is loading again', async () => {
    const actions = createActionRegistry();
    setActionRegistrySettled(actions, true);
    setActionRegistrySettled(actions, false);
    const waiting = whenActionRegistered(actions, 'open', 15000);
    const open = () => 'opened';
    actions.set('open', open);
    await expect(waiting).resolves.toBe(open);
  });

  it('is a plain Map of the handlers, as the component reads and writes it', () => {
    const actions = createActionRegistry();
    actions.set('open', () => {});
    expect(Object.getPrototypeOf(actions)).toBe(Map.prototype);
    expect([...actions.keys()]).toEqual(['open']);
    actions.delete('open');
    expect(actions.has('open')).toBe(false);
  });

  it('treats a Map it did not make as settled: nothing waits on it', async () => {
    const actions = new Map();
    expect(isActionRegistrySettled(actions)).toBe(true);
    await expect(whenActionRegistered(actions, 'open', 15000)).resolves.toBeUndefined();
    setActionRegistrySettled(actions, false);
    expect(isActionRegistrySettled(actions)).toBe(true);
  });
});
