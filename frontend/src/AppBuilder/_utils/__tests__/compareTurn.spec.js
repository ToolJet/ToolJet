import { COMPARE_TURN_GRANT, COMPARE_TURN_REQUEST, waitForCompareTurn } from '../compareFrame';

// The compare view boots two viewers on the editor's main thread. Both fetch at once, but each asks for a turn before
// it builds its app, so only one of them runs that heavy work at a time.
describe('waiting for a turn in a compare frame', () => {
  let parent;
  let frame;

  const openAt = (search) => window.history.replaceState(null, '', `/applications/a/home${search}`);
  const grant = (source = parent) =>
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: COMPARE_TURN_GRANT }, source, origin: window.location.origin })
    );
  const settles = async (promise) => {
    let done = false;
    promise.then(() => (done = true));
    await Promise.resolve();
    await Promise.resolve();
    return done;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // A real window, so it can be the source of a message.
    frame = document.createElement('iframe');
    document.body.appendChild(frame);
    parent = frame.contentWindow;
    jest.spyOn(parent, 'postMessage').mockImplementation(() => {});
    Object.defineProperty(window, 'parent', { value: parent, configurable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.defineProperty(window, 'parent', { value: window, configurable: true });
    frame.remove();
    window.history.replaceState(null, '', '/');
  });

  it('goes ahead at once outside a compare frame', async () => {
    openAt('?version=v1&turns=1');
    expect(await settles(waitForCompareTurn())).toBe(true);
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('goes ahead at once in a compare frame that was not asked to take turns', async () => {
    openAt('?version=v1&compare=1');
    expect(await settles(waitForCompareTurn())).toBe(true);
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('asks the compare view for a turn and waits until it is given', async () => {
    openAt('?version=v1&compare=1&turns=1');
    const waiting = waitForCompareTurn();
    expect(parent.postMessage).toHaveBeenCalledWith({ type: COMPARE_TURN_REQUEST }, window.location.origin);
    expect(await settles(waiting)).toBe(false);
    grant();
    expect(await settles(waiting)).toBe(true);
  });

  it('does not take a turn given by anything but the compare view', async () => {
    openAt('?version=v1&compare=1&turns=1');
    const waiting = waitForCompareTurn();
    grant(window);
    expect(await settles(waiting)).toBe(false);
  });

  it('goes ahead on its own when no turn comes, so a frame never hangs', async () => {
    openAt('?version=v1&compare=1&turns=1');
    const waiting = waitForCompareTurn({ timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);
    expect(await settles(waiting)).toBe(true);
  });
});
