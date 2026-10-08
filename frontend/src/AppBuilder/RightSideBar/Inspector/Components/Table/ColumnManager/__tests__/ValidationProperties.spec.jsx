/**
 * Regression for the "Minimum date"/"Maximum date" calendar popover rendered by this
 * shared component — used by both the Table widget's column-settings panel
 * (`ColumnPopover.jsx`, popover id `table-column-popover-basic`) and the KeyValuePair
 * widget's field-settings panel (`FieldPopover.jsx`, popover id `popover-basic-2`), per
 * `table-component.scss`'s `.table-column-popover#popover-basic-2,
 * .table-column-popover#table-column-popover-basic` rule. Two compounding bugs:
 *
 * 1. ReactDatePicker/Timepicker rendered inline (no `portalId`) mounts its calendar
 *    inside `.table-column-popover .popover-body` — the same scrollable container that
 *    later renders the rest of the panel (e.g. Table's "Lock column schema"/"Action
 *    Buttons", or KeyValuePair's other field settings) — so it gets clipped/underlapped
 *    by that content.
 * 2. Portaling into the canvas's shared `#component-portal` does escape the popover
 *    body, but that node lives inside `.tj-canvas-area`, which carries
 *    `transform: translateZ(0)` (DesktopLayout.jsx) — a CSS transform on an ancestor
 *    becomes the containing block for the portaled popper's absolute positioning, so a
 *    calendar triggered from an Inspector field (outside the canvas subtree) ends up
 *    positioned nowhere near its input.
 *
 * The fix uses a portal id that has no pre-existing DOM node anywhere
 * (`table-column-datepicker-portal`): react-datepicker's own Portal auto-creates it as a
 * fresh child of `document.body` when it doesn't already exist, which is outside both
 * the clipped popover body and the transformed canvas subtree.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidationProperties } from '../ValidationProperties';

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <input
    data-testid={`code-hinter-${props.componentName}`}
    defaultValue={props.initialValue}
    onChange={(e) => props.onChange(e.target.value)}
  />
));

const renderValidationProperties = (popoverId) =>
  render(
    <>
      {/* Mirrors the real canvas subtree: a transformed ancestor pre-declaring #component-portal. */}
      <div className="tj-canvas-area" style={{ transform: 'translateZ(0)' }}>
        <div id="component-portal" />
      </div>
      {/* The Inspector (Table's or KeyValuePair's) lives outside the canvas subtree entirely. */}
      <div id={popoverId} className="table-column-popover">
        <div className="popover-body">
          <ValidationProperties
            item={{ minDate: '', maxDate: '', isTimeChecked: false, disabledDates: '', customRule: '' }}
            itemType="datepicker"
            index={0}
            darkMode={false}
            currentState={{}}
            onColumnItemChange={jest.fn()}
            getPopoverFieldSource={(columnType, field) => field}
            setColumnPopoverRootCloseBlocker={jest.fn()}
          />
        </div>
      </div>
    </>
  );

describe.each([
  ['Table column-settings popover', 'table-column-popover-basic'],
  ['KeyValuePair field-settings popover', 'popover-basic-2'],
])('ValidationProperties in the %s: datepicker minDate/maxDate calendar', (_label, popoverId) => {
  it('mounts the calendar outside both the clipped .popover-body and the transformed .tj-canvas-area', async () => {
    renderValidationProperties(popoverId);

    const minDateInput = screen.getAllByPlaceholderText('MM/DD/YYYY')[0];
    await userEvent.click(minDateInput);

    const calendarPopper = document.querySelector('.react-datepicker-popper');
    expect(calendarPopper).not.toBeNull();

    const clippedPopoverBody = document.querySelector('.popover-body');
    const transformedCanvasArea = document.querySelector('.tj-canvas-area');

    expect(clippedPopoverBody.contains(calendarPopper)).toBe(false);
    expect(transformedCanvasArea.contains(calendarPopper)).toBe(false);
  });

  /**
   * KeyValuePair's field-settings popover is only ~280px wide and lays Minimum/Maximum
   * date out as two side-by-side columns. The portal fix above (correctly) lets the
   * calendar escape the popover's own clipping, but a left-aligned ("bottom-start")
   * calendar opened from the right-hand "Maximum date" column is 250px wide — wider
   * than the available room to its right — so it overflowed onto the separate,
   * unrelated Inspector "Fields" list panel next to the popover. Anchoring the end
   * (right-hand) field's calendar to its own right edge ("bottom-end") instead keeps
   * it extending leftward, back over the popover's own content, for both widgets.
   */
  it('anchors Minimum date/time to bottom-start and Maximum date/time to bottom-end', async () => {
    renderValidationProperties(popoverId);

    const [minDateInput, maxDateInput] = screen.getAllByPlaceholderText('MM/DD/YYYY');

    await userEvent.click(minDateInput);
    const minPopper = document.querySelector('.react-datepicker-popper');
    expect(minPopper.getAttribute('data-placement')).toBe('bottom-start');

    await userEvent.click(maxDateInput);
    const poppers = document.querySelectorAll('.react-datepicker-popper');
    const maxPopper = poppers[poppers.length - 1];
    expect(maxPopper.getAttribute('data-placement')).toBe('bottom-end');
  });
});
