// Enter is the keyboard twin of the footer's primary button. While that button is disabled, Enter
// must do nothing - it used to submit the form anyway.
import React from 'react';
import { render, userEvent } from '@/test/test-utils';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';

const renderFooter = (props) => {
  const handlers = { onCreate: jest.fn(), onEdit: jest.fn(), onClose: jest.fn() };
  render(<DrawerFooter {...handlers} {...props} />);
  return handlers;
};

describe('DrawerFooter Enter shortcut', () => {
  test('should save on Enter when the Save button is enabled', async () => {
    const { onEdit } = renderFooter({ initiator: 'EditColumnForm', isEditMode: true, shouldDisableCreateBtn: false });

    await userEvent.keyboard('{Enter}');

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('should not save on Enter when the Save button is disabled', async () => {
    const { onEdit } = renderFooter({ initiator: 'EditColumnForm', isEditMode: true, shouldDisableCreateBtn: true });

    await userEvent.keyboard('{Enter}');

    expect(onEdit).not.toHaveBeenCalled();
  });

  test('should not create on Enter when the Create button is disabled', async () => {
    const { onCreate } = renderFooter({ initiator: 'CreateColumnForm', shouldDisableCreateBtn: true });

    await userEvent.keyboard('{Enter}');

    expect(onCreate).not.toHaveBeenCalled();
  });

  test('should not submit on Enter while the footer is fetching', async () => {
    const { onEdit } = renderFooter({ initiator: 'EditColumnForm', isEditMode: true, fetching: true });

    await userEvent.keyboard('{Enter}');

    expect(onEdit).not.toHaveBeenCalled();
  });

  test('should still close on Escape when the primary button is disabled', async () => {
    const { onClose } = renderFooter({ initiator: 'EditColumnForm', isEditMode: true, shouldDisableCreateBtn: true });

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
