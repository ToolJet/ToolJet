/**
 * PG-31: a greyed page menu row still explains itself. Home's "Delete page" carries the tooltip
 * "Home page can't be deleted"; a native disabled button fires no hover events, so it never showed.
 */
import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/test-utils';
import { ToolTip } from '@/_components/ToolTip';
import PageOptions from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/PageOptions';

const renderDeleteOnHome = (onClick = jest.fn()) => {
  render(
    <PageOptions
      text={
        <ToolTip message="Home page can't be deleted" placement="auto" show>
          <span>Delete page</span>
        </ToolTip>
      }
      icon="trash"
      danger
      disabled
      onClick={onClick}
    />
  );
  return onClick;
};

// Break this catches: the row is a native disabled button again, so hovering shows nothing.
test('hovering the disabled Delete page shows why', async () => {
  renderDeleteOnHome();

  await userEvent.hover(screen.getByText('Delete page'));

  expect(await screen.findByText("Home page can't be deleted")).toBeInTheDocument();
});

// Break this catches: making the row hoverable also makes it clickable.
test('the disabled row reads as disabled and ignores clicks', async () => {
  const onClick = renderDeleteOnHome();

  const row = screen.getByRole('button', { name: /Delete page/ });
  expect(row).toHaveAttribute('aria-disabled', 'true');
  // The global .disabled class sets pointer-events: none, which also kills the tooltip.
  expect(row).not.toHaveClass('disabled');

  await userEvent.click(row);

  expect(onClick).not.toHaveBeenCalled();
});
