import React from 'react';
import { screen } from '@testing-library/react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { usePopoverState } from '../../hooks';

const scenario = defineAppBuilderScenario({
  id: 'table-column-popover-switch-column',
  name: 'Table Edit Column popover when another column is clicked',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {},
});

const COLUMNS = ['id', 'name'];

/**
 * Mirrors the per-column OverlayTrigger wiring Table.jsx uses around the "Edit Column" popover
 * (trigger="click", controlled `show`, `rootClose` and `onToggle` driven by the real usePopoverState),
 * without the surrounding column-list/DnD chrome. See ColumnPopoverRootClose.spec.jsx for why the real
 * Table.jsx tree is not mounted.
 */
function ColumnList() {
  const { activeIndex, isRootCloseEnabled, togglePopover } = usePopoverState();

  return (
    <div>
      {COLUMNS.map((name, index) => (
        <OverlayTrigger
          key={name}
          trigger="click"
          show={activeIndex === index}
          placement="left-start"
          flip={false}
          rootClose={isRootCloseEnabled}
          onToggle={(show) => togglePopover(index, show)}
          overlay={
            <Popover id={`table-column-popover-${name}`}>
              <Popover.Header>Edit Column</Popover.Header>
              <Popover.Body>{`Settings for ${name}`}</Popover.Body>
            </Popover>
          }
        >
          <button type="button">{name}</button>
        </OverlayTrigger>
      ))}
    </div>
  );
}

describe('[Table-BUG-034] Edit Column popover when another column is clicked', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
    session.render(<ColumnList />);
  });

  test('clicking another column closes the open popover and opens the new column popover', async () => {
    await session.user.click(screen.getByRole('button', { name: 'id' }));
    expect(screen.getByText('Settings for id')).toBeInTheDocument();

    await session.user.click(screen.getByRole('button', { name: 'name' }));

    expect(await screen.findByText('Settings for name')).toBeInTheDocument();
    expect(screen.queryByText('Settings for id')).not.toBeInTheDocument();
    expect(screen.getAllByText('Edit Column')).toHaveLength(1);
  });

  test('clicking the already open column closes its popover', async () => {
    await session.user.click(screen.getByRole('button', { name: 'id' }));
    expect(screen.getByText('Settings for id')).toBeInTheDocument();

    await session.user.click(screen.getByRole('button', { name: 'id' }));

    expect(screen.queryByText('Edit Column')).not.toBeInTheDocument();
  });

  test('clicking outside the open popover closes it', async () => {
    await session.user.click(screen.getByRole('button', { name: 'id' }));
    expect(screen.getByText('Settings for id')).toBeInTheDocument();

    await session.user.click(document.body);

    expect(screen.queryByText('Edit Column')).not.toBeInTheDocument();
  });
});
