import { awaitSdkAction, getSdkActionReadiness, setSdkActionReadiness } from '@/AppBuilder/_utils/sdkActionReadiness';

// An action called on a pack component waits for it only while the widget is still loading (QA item 33): a Control
// component action that can never run must not hold the event's next actions for long.
describe('waiting for a pack component action', () => {
  let exposed;
  let storeListeners;
  const subscribeStore = (listener) => {
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  };
  const expose = (value) => {
    exposed = value;
    storeListeners.forEach((listener) => listener());
  };
  const wait = (options = {}) =>
    awaitSdkAction({
      moduleId: 'canvas',
      componentId: 'd1',
      handle: 'open',
      read: () => exposed,
      subscribeStore,
      ...options,
    });
  const ready = (...actions) => setSdkActionReadiness('canvas', 'd1', { status: 'ready', actions: new Set(actions) });

  beforeEach(() => {
    jest.useFakeTimers();
    exposed = undefined;
    storeListeners = new Set();
  });
  afterEach(() => {
    setSdkActionReadiness('canvas', 'd1', null);
    jest.useRealTimers();
  });

  it('gives an action that is already exposed at once', async () => {
    const open = () => {};
    exposed = open;
    await expect(wait()).resolves.toBe(open);
  });

  it('waits while the widget is loading, and gives the action once it is exposed', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait();
    jest.advanceTimersByTime(10000);
    const open = () => {};
    ready('open');
    expose(open);
    await expect(result).resolves.toBe(open);
  });

  it('keeps waiting when ready with the action, until the store has it', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait();
    ready('open');
    const open = () => {};
    expose(open);
    await expect(result).resolves.toBe(open);
  });

  it('stops at once when the ready widget has no such action', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait();
    ready('close');
    await expect(result).resolves.toBeUndefined();
  });

  it('stops when no widget mounts in time, as one never drawn (a tab not opened)', async () => {
    const result = wait({ mountWaitMs: 3000 });
    jest.advanceTimersByTime(3000);
    await expect(result).resolves.toBeUndefined();
  });

  it('keeps waiting for a widget that mounts in time, then loads', async () => {
    const result = wait({ mountWaitMs: 3000 });
    jest.advanceTimersByTime(1000);
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    jest.advanceTimersByTime(5000);
    const open = () => {};
    ready('open');
    expose(open);
    await expect(result).resolves.toBe(open);
  });

  it('stops when the widget is removed while it waits', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait();
    setSdkActionReadiness('canvas', 'd1', null);
    await expect(result).resolves.toBeUndefined();
  });

  it('stops after the longest wait, should a manifest never load', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait({ maxWaitMs: 15000 });
    jest.advanceTimersByTime(15000);
    await expect(result).resolves.toBeUndefined();
  });

  it('keeps waiting while another instance of the widget is mounted (List view rows)', async () => {
    const rowA = {};
    const rowB = {};
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' }, rowA);
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' }, rowB);
    const result = wait();
    setSdkActionReadiness('canvas', 'd1', null, rowA);
    const open = () => {};
    setSdkActionReadiness('canvas', 'd1', { status: 'ready', actions: new Set(['open']) }, rowB);
    expose(open);
    await expect(result).resolves.toBe(open);
    setSdkActionReadiness('canvas', 'd1', null, rowB);
  });

  it('is ready once any instance is, with the actions of those ready', () => {
    const rowA = {};
    const rowB = {};
    setSdkActionReadiness('canvas', 'd2', { status: 'loading' }, rowA);
    expect(getSdkActionReadiness('canvas', 'd2')).toEqual({ status: 'loading' });
    setSdkActionReadiness('canvas', 'd2', { status: 'ready', actions: new Set(['open']) }, rowB);
    expect(getSdkActionReadiness('canvas', 'd2')).toEqual({ status: 'ready', actions: new Set(['open']) });
    setSdkActionReadiness('canvas', 'd2', null, rowA);
    setSdkActionReadiness('canvas', 'd2', null, rowB);
    expect(getSdkActionReadiness('canvas', 'd2')).toBeUndefined();
  });

  it('keeps each module apart: the same widget id in another module is another widget', () => {
    setSdkActionReadiness('module-a', 'd3', { status: 'ready', actions: new Set(['open']) });
    expect(getSdkActionReadiness('module-b', 'd3')).toBeUndefined();
    setSdkActionReadiness('module-a', 'd3', null);
  });

  it('keeps no listener once it has stopped', async () => {
    setSdkActionReadiness('canvas', 'd1', { status: 'loading' });
    const result = wait();
    ready('close');
    await result;
    expect(storeListeners.size).toBe(0);
  });
});
