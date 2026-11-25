import { waitForCompareTurn } from '../compareFrame';

// A module on a page builds with the same viewer code, inside its frame. When it asked for a turn too, the compare
// view took it for the frame starting over: it handed the frame's turn to the other version mid-build, made the
// module wait for the other version, and left a turn nobody gave back for 20 s.
describe('a module embedded in a compare frame', () => {
  let parent;
  let frame;

  const settles = async (promise) => {
    let done = false;
    promise.then(() => (done = true));
    await Promise.resolve();
    await Promise.resolve();
    return done;
  };

  beforeEach(() => {
    frame = document.createElement('iframe');
    document.body.appendChild(frame);
    parent = frame.contentWindow;
    jest.spyOn(parent, 'postMessage').mockImplementation(() => {});
    Object.defineProperty(window, 'parent', { value: parent, configurable: true });
    window.history.replaceState(null, '', '/applications/a/home?version=v1&compare=1&turns=1');
  });

  afterEach(() => {
    Object.defineProperty(window, 'parent', { value: window, configurable: true });
    frame.remove();
    window.history.replaceState(null, '', '/');
  });

  it('builds within its frame’s turn, without asking for one', async () => {
    expect(await settles(waitForCompareTurn({ embedded: true }))).toBe(true);
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('leaves the frame itself asking for its turn', async () => {
    expect(await settles(waitForCompareTurn({ embedded: false }))).toBe(false);
    expect(parent.postMessage).toHaveBeenCalledTimes(1);
  });
});
