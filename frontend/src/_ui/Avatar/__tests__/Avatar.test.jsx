import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import Avatar from '../index';
import { userService } from '../../../_services';

jest.mock('../../../_services', () => ({
  userService: { getAvatar: jest.fn() },
}));

jest.mock('react-tooltip', () => ({
  Tooltip: () => null,
}));

// Resolves only when the test says so, so a slow response can be held open
// while the component moves on to a different avatarId.
function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('Avatar', () => {
  let created;
  let revoked;

  beforeEach(() => {
    created = 0;
    revoked = [];
    global.URL.createObjectURL = jest.fn(() => `blob:avatar-${++created}`);
    global.URL.revokeObjectURL = jest.fn((url) => revoked.push(url));
    userService.getAvatar.mockReset();
  });

  afterEach(cleanup);

  it('revokes the object url it created when unmounted', async () => {
    userService.getAvatar.mockResolvedValue(new Blob());

    const { unmount } = render(<Avatar avatarId="a1" title="A" />);
    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1));

    unmount();

    expect(revoked).toEqual(['blob:avatar-1']);
  });

  it('revokes the previous object url when avatarId changes', async () => {
    userService.getAvatar.mockResolvedValue(new Blob());

    const { rerender } = render(<Avatar avatarId="a1" title="A" />);
    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1));

    rerender(<Avatar avatarId="a2" title="A" />);
    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalledTimes(2));

    expect(revoked).toContain('blob:avatar-1');
  });

  it('ignores a response that arrives after avatarId has moved on', async () => {
    const slow = deferred();
    userService.getAvatar.mockReturnValueOnce(slow.promise).mockResolvedValue(new Blob());

    const { rerender } = render(<Avatar avatarId="a1" title="A" />);
    rerender(<Avatar avatarId="a2" title="A" />);

    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1));
    const urlForSecondAvatar = `blob:avatar-${created}`;

    // The first request now lands, after the component has already moved to a2.
    slow.resolve(new Blob());
    await Promise.resolve();

    // It must not create a url or overwrite the one belonging to a2.
    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1));
    expect(revoked).not.toContain(urlForSecondAvatar);
  });
});
