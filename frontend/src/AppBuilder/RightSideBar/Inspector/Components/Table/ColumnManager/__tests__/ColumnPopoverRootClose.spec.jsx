import React from 'react';
import { screen, within } from '@testing-library/react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { usePopoverState } from '../../hooks';
import DatepickerProperties from '../DatepickerProperties';
import { ValidationProperties } from '../ValidationProperties';

const scenario = defineAppBuilderScenario({
  id: 'table-column-popover-rootclose',
  name: 'Table Edit Column popover vs. portaled Select/ReactDatePicker controls',
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
 * Mirrors the real OverlayTrigger wiring Table.jsx uses around the "Edit Column"
 * popover (Table.jsx:571-600 - trigger="click", a controlled `show`, `rootClose`
 * driven by the real usePopoverState, and `onToggle`) with `body` (a real
 * production field-editor component, either DatepickerProperties or
 * ValidationProperties) as the overlay content, but without the surrounding
 * column-list/DnD chrome or ColumnPopoverContent's own header.
 *
 * Two deliberate departures from mounting the real, unmocked Table.jsx Inspector
 * or its ColumnPopoverContent wrapper, both explained here rather than fixed,
 * since neither is this bug's production surface:
 *  1. Table.jsx's "Events" accordion item is `isOpen: true` and eagerly renders
 *     an always-mounted EventManager (Table.jsx:740-758), and its "Devices"
 *     section eagerly calls the generic renderElement(...) (unrelated to any
 *     column popover) at mount time regardless of which column is selected -
 *     this widget's own TESTING.md already flags exactly this kind of heavy,
 *     unrelated seeding as the reason several other Inspector-only Table bugs
 *     were deferred instead of tested through the full Table.jsx tree.
 *  2. ColumnPopoverContent's header renders two `isLucid` Button
 *     (trailingIcon="copy"/"trash") controls. No existing spec in this repo
 *     renders an `isLucid` Button, and doing so here hits a real crash in the
 *     shared `__mocks__/lucideDynamicIcon.jsx` stub (`iconNode.map is not a
 *     function`) - lucide-react's CJS `icons['Copy']`/`icons['Trash']` are full
 *     forwardRef components in the installed version, not the raw path-node
 *     array the mock assumes for every icon name. That mock is shared test
 *     infrastructure with no coverage of its own yet; fixing it is a separate,
 *     unrelated concern from this bug's fix, so this test bypasses the header
 *     entirely (own literal "Edit Column" text below, matching
 *     ColumnPopoverContent's real header text) rather than silently working
 *     around or touching that shared mock.
 * usePopoverState, OverlayTrigger, Popover, DatepickerProperties, and
 * ValidationProperties are all real, unmocked production code.
 */
function ColumnPopoverHost({ body }) {
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
        <Popover id="table-column-popover-basic" style={{ width: '280px' }}>
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

describe('[Table-BUG-014] Edit Column popover closes on a click inside a portaled Select/ReactDatePicker', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('picking an option from the "Unix timestamp" Select (a document.body portal) keeps the popover open', async () => {
    const column = buildDatepickerColumn({ parseInUnixTimestamp: true, unixTimestamp: 'seconds' });
    session.render(
      <ColumnPopoverHost
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
