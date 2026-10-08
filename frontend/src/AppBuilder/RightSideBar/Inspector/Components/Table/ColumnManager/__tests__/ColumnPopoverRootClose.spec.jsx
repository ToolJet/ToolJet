import React from 'react';
import { screen, within } from '@testing-library/react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { usePopoverState } from '../../hooks';
import DatepickerProperties from '../DatepickerProperties';
import { ValidationProperties } from '../ValidationProperties';

const scenario = defineAppBuilderScenario({
  id: 'column-popover-rootclose',
  name: 'Edit Column/Field popover vs. portaled Select/ReactDatePicker controls',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // DatepickerProperties' "Date"/"Time zone" fx-active fields mount CodeHinter
  // (SingleLineCodeEditor), which observes its own element with
  // IntersectionObserver/ResizeObserver - real browser APIs jsdom doesn't
  // implement. `observers` is one of this harness's documented controllable
  // seams (see README's "Control only genuine boundaries" list).
  capabilities: { observers: true },
});

const buildDatepickerColumn = (overrides = {}) => ({
  id: 'col1',
  name: 'due_date',
  key: 'due_date',
  columnType: 'datepicker',
  isDateSelectionEnabled: true,
  isTimeChecked: false,
  isEditable: true,
  parseInUnixTimestamp: false,
  ...overrides,
});

/**
 * Mirrors the real OverlayTrigger wiring both Table.jsx's "Edit Column" popover
 * (Table.jsx:571-600) and KeyValuePair.jsx's "Edit field" popover
 * (`popover-basic-2`) use (trigger="click", a controlled `show`, `rootClose`
 * driven by the real usePopoverState, and `onToggle`), with `body` (a real
 * production field-editor component, either DatepickerProperties or
 * ValidationProperties - shared verbatim between both widgets) as the overlay
 * content, but without the surrounding column/field-list/DnD chrome or either
 * widget's own popover-header component.
 *
 * usePopoverState, OverlayTrigger, Popover, DatepickerProperties, and
 * ValidationProperties are all real, unmocked production code.
 */
function ColumnPopoverHost({ popoverId, body }) {
  const { activeIndex, isRootCloseEnabled, togglePopover } = usePopoverState();

  return (
    <OverlayTrigger
      trigger="click"
      show={activeIndex === 0}
      placement="left-start"
      flip={false}
      rootClose={isRootCloseEnabled}
      onToggle={(show) => togglePopover(0, show)}
      overlay={
        <Popover id={popoverId} style={{ width: '280px' }}>
          <Popover.Header>Edit Column</Popover.Header>
          <Popover.Body className="table-column-popover">{body}</Popover.Body>
        </Popover>
      }
    >
      <button type="button" data-cy="column-due_date">
        due_date
      </button>
    </OverlayTrigger>
  );
}

const isPopoverOpen = () => screen.queryByText('Edit Column') !== null;

describe.each([
  ['Table column-settings popover', 'table-column-popover-basic'],
  ['KeyValuePair field-settings popover', 'popover-basic-2'],
])('Edit Column/Field popover closes on a click inside a portaled Select/ReactDatePicker (%s)', (_label, popoverId) => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('picking an option from the "Unix timestamp" Select (a document.body portal) keeps the popover open', async () => {
    const column = buildDatepickerColumn({ parseInUnixTimestamp: true, unixTimestamp: 'seconds' });
    session.render(
      <ColumnPopoverHost
        popoverId={popoverId}
        body={
          <DatepickerProperties
            column={column}
            index={0}
            darkMode={false}
            currentState={{}}
            onColumnItemChange={() => {}}
            component={{ id: 'table1', component: { name: 'table1' } }}
          />
        }
      />
    );

    await session.user.click(screen.getByText('due_date'));
    expect(isPopoverOpen()).toBe(true);

    // Opens the Select's menu, which SelectComponent renders into a
    // document.body portal by default (useMenuPortal: true).
    await session.user.click(screen.getByText('s')); // current value's label
    const msOption = await screen.findByText('ms');
    await session.user.click(msOption);

    expect(isPopoverOpen()).toBe(true);
  });

  test('picking a day from the "Minimum date" calendar (a document.body portal) keeps the popover open', async () => {
    const column = buildDatepickerColumn();
    session.render(
      <ColumnPopoverHost
        popoverId={popoverId}
        body={
          <ValidationProperties
            item={column}
            itemType="datepicker"
            index={0}
            darkMode={false}
            currentState={{}}
            onColumnItemChange={() => {}}
            getPopoverFieldSource={() => 'table1_column_due_date'}
            setColumnPopoverRootCloseBlocker={() => {}}
          />
        }
      />
    );

    await session.user.click(screen.getByText('due_date'));
    expect(isPopoverOpen()).toBe(true);

    const minDateField = screen.getByText('Minimum date').closest('.inspector-validation-date-picker');
    await session.user.click(within(minDateField).getByPlaceholderText('MM/DD/YYYY'));
    const day15 = await screen.findByText('15', {
      selector: '.react-datepicker__day:not(.react-datepicker__day--outside-month)',
    });
    await session.user.click(day15);

    expect(isPopoverOpen()).toBe(true);
  });

  test('picking a time from the "Minimum time" calendar (a document.body portal) keeps the popover open', async () => {
    const column = buildDatepickerColumn({ isTimeChecked: true });
    session.render(
      <ColumnPopoverHost
        popoverId={popoverId}
        body={
          <ValidationProperties
            item={column}
            itemType="datepicker"
            index={0}
            darkMode={false}
            currentState={{}}
            onColumnItemChange={() => {}}
            getPopoverFieldSource={() => 'table1_column_due_date'}
            setColumnPopoverRootCloseBlocker={() => {}}
          />
        }
      />
    );

    await session.user.click(screen.getByText('due_date'));
    expect(isPopoverOpen()).toBe(true);

    const minTimeField = screen.getByText('Minimum time').closest('.inspector-validation-date-picker');
    await session.user.click(within(minTimeField).getByPlaceholderText('HH:mm'));
    const timeOption = await screen.findByText('00:00', { selector: '.react-datepicker__time-list-item' });
    await session.user.click(timeOption);

    expect(isPopoverOpen()).toBe(true);
  });
});
