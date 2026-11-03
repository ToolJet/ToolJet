import { railClick } from '../railClick';

const base = { pinned: false, codeMode: true, overChat: false };

describe('left rail clicks', () => {
  it('when the chat is home, a panel opened over the chat closes back to the chat on its own icon', () => {
    const security = railClick({ ...base, item: 'security', selected: 'tooljetai', open: true });
    expect(security).toEqual({ show: 'security', overChat: true });
    // On to another panel: still over the chat.
    const history = railClick({ ...base, item: 'history', selected: 'security', open: true, overChat: true });
    expect(history).toEqual({ show: 'history', overChat: true });
    expect(railClick({ ...base, item: 'history', selected: 'history', open: true, overChat: true })).toEqual({
      show: 'tooljetai',
      overChat: false,
    });
  });

  it('closes the sidebar on the open panel’s icon otherwise: no chat underneath, the chat itself, or the visual builder', () => {
    expect(railClick({ ...base, item: 'security', selected: 'security', open: true }).show).toBeNull();
    expect(railClick({ ...base, item: 'tooljetai', selected: 'tooljetai', open: true }).show).toBeNull();
    const visual = { ...base, codeMode: false };
    expect(railClick({ ...visual, item: 'debugger', selected: 'tooljetai', open: true }).overChat).toBe(false);
    expect(
      railClick({ ...visual, item: 'debugger', selected: 'debugger', open: true, overChat: true }).show
    ).toBeNull();
  });
});
