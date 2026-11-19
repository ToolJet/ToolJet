import { isolateInteractiveEvents } from '../InlineLibraryComponent';

// QA item 24: in the editor a drag on a pack Kanban card moved the whole widget. The card is marked
// [data-tj-inner-drag], but the canvas cannot see into the pack's shadow root, so it took every press as the start of a
// widget drag; the pack's own hold only began after a first plain click. The host now stops a press on such a part from
// the first press, when it is given what to do in the editor's place (select the widget), and leaves every other press
// as it was.
const setup = (options) => {
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML =
    '<div data-board><div data-tj-inner-drag data-card><p data-title>Card</p></div><div data-header>To do</div></div>';
  document.body.appendChild(host);
  const release = isolateInteractiveEvents(host, options);
  const outside = jest.fn();
  document.addEventListener('mousedown', outside);
  document.addEventListener('touchstart', outside);
  return {
    part: (name) => root.querySelector(`[data-${name}]`),
    outside,
    cleanup: () => {
      release();
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
      host.remove();
    },
  };
};
const press = (el, init = {}) =>
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0, ...init }));

describe('a press on a part of a pack widget that drags itself (a Kanban card)', () => {
  let env;
  afterEach(() => env?.cleanup());

  // Break this catches: the host leaving the card's press to the canvas, which drags the whole widget.
  it('is kept from the canvas from the first press in the editor, and selects the widget there', () => {
    const onInnerPress = jest.fn();
    env = setup({ onInnerPress });
    press(env.part('title'));
    expect(env.outside).not.toHaveBeenCalled();
    expect(onInnerPress).toHaveBeenCalledTimes(1);
  });

  it('does the same for a touch', () => {
    const onInnerPress = jest.fn();
    env = setup({ onInnerPress });
    env.part('card').dispatchEvent(new Event('touchstart', { bubbles: true, composed: true }));
    expect(env.outside).not.toHaveBeenCalled();
    expect(onInnerPress).toHaveBeenCalledTimes(1);
  });

  it('leaves a press elsewhere in the widget to the canvas, which selects and moves the widget', () => {
    const onInnerPress = jest.fn();
    env = setup({ onInnerPress });
    press(env.part('header'));
    expect(env.outside).toHaveBeenCalledTimes(1);
    expect(onInnerPress).not.toHaveBeenCalled();
  });

  it.each([
    ['Shift', { shiftKey: true }],
    ['Cmd', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['the right button', { button: 2 }],
  ])('leaves a press with %s to the editor (adding to a selection, its menu)', (_, init) => {
    const onInnerPress = jest.fn();
    env = setup({ onInnerPress });
    press(env.part('card'), init);
    expect(env.outside).toHaveBeenCalledTimes(1);
    expect(onInnerPress).not.toHaveBeenCalled();
  });

  it('stops nothing in a released app, where nothing above the widget drags it', () => {
    env = setup();
    press(env.part('card'));
    expect(env.outside).toHaveBeenCalledTimes(1);
  });
});
