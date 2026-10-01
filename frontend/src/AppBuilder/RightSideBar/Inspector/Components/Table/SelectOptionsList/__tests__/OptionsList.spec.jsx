import React from 'react';
import { screen } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { OptionsList } from '../OptionsList';

const scenario = defineAppBuilderScenario({
  id: 'table-select-options-popover-remount',
  name: 'Table select column Options editor popover vs. blur-committed label',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // The label/value fields mount the real CodeHinter (SingleLineCodeEditor),
  // which observes its own element with IntersectionObserver/ResizeObserver -
  // real browser APIs jsdom doesn't implement. `observers` is one of this
  // harness's documented controllable seams (see README's "Control only
  // genuine boundaries" list).
  capabilities: { observers: true },
});

const buildColumn = (overrides = {}) => ({
  columnType: 'select',
  options: [
    { label: 'Option 1', value: 'Option 1' },
    { label: 'Option 2', value: 'Option 2' },
  ],
  ...overrides,
});

/**
 * Mounts the real, unmocked `OptionsList` the way Table's "Edit Column" popover
 * does for select/newMultiSelect/tagsV2 columns (`ColumnManager/PropertiesTabElements.jsx:504`),
 * with a `props.paramUpdated` that re-renders on every commit - mirroring how a
 * real store update propagates a new render down to `OptionsList` in production.
 * `column` is mutated in place by `OptionsList`'s own `handleSelectOption` (matching
 * production: `options[optionIndex][optionItemChanged] = value` mutates the existing
 * option object), so re-rendering with the same `column` reference already reflects
 * the committed edit.
 */
function OptionsListHost({ column }) {
  const [, forceRerender] = React.useState(0);
  const propsRef = React.useRef({
    component: {
      component: {
        definition: {
          properties: {
            columns: { value: [column] },
          },
        },
      },
    },
    paramUpdated: () => forceRerender((tick) => tick + 1),
  });

  return (
    <OptionsList
      column={column}
      props={propsRef.current}
      index={0}
      darkMode={false}
      currentState={{}}
      getPopoverFieldSource={(columnType, field) => field}
      setColumnPopoverRootCloseBlocker={() => {}}
      onColumnItemChange={() => {}}
      component={{ id: 'table1', component: { name: 'table1' } }}
      paramToUpdate={'columns'}
    />
  );
}

const isOptionPopoverOpen = () => screen.queryByText('Option value') !== null;

// jsdom implements neither `Range.prototype.getClientRects` nor
// `getBoundingClientRect` (no layout engine). CodeMirror 6's text-metrics
// fallback (`measureTextSize`'s "force a layout of a measurable element"
// branch, @codemirror/view/dist/index.cjs) depends on the former to measure a
// throwaway `.cm-line` probe node it appends directly into the editor's own
// content DOM; without it, the measurement throws mid-function and the probe
// - textContent "abc def ghi jkl mno pqr stu" - is never removed, permanently
// leaking into `.cm-content` and corrupting whatever the real editor's value
// is read as. Polyfilling an empty-rects stub lets that measurement finish
// (its own code already treats "no rect" as a valid 7px-wide fallback) so the
// probe's cleanup (`dummy.remove()`) runs as CodeMirror intends.
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [];
}

describe('[Table-BUG-019] The select column Options editor popover closes when a label edit commits on blur', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('editing an option label and moving focus to the Option value field keeps the popover open and commits the new label', async () => {
    const column = buildColumn();
    session.render(<OptionsListHost column={column} />);

    await session.user.click(screen.getByText('Option 1'));
    expect(isOptionPopoverOpen()).toBe(true);

    // The label field is the real CodeHinter/CodeMirror editor; react-bootstrap's
    // Popover portals it to document.body, outside the render container.
    const labelField = document.querySelectorAll('.cm-content')[0];
    await session.user.click(labelField);
    await session.user.type(labelField, 'Updated');

    // Moving focus to the Option value field blurs the label field, committing
    // its value (CodeHinter only calls `onChange` on blur, not per keystroke).
    await session.user.click(screen.getByText('Option value'));

    expect(isOptionPopoverOpen()).toBe(true);
    expect(column.options[0].label).toBe('UpdatedOption 1');
    expect(screen.getByText('UpdatedOption 1')).toBeInTheDocument();
  });

  test('editing the second option in a multi-option list keeps its own popover open on blur', async () => {
    const column = buildColumn();
    session.render(<OptionsListHost column={column} />);

    await session.user.click(screen.getByText('Option 2'));
    expect(isOptionPopoverOpen()).toBe(true);

    const labelField = document.querySelectorAll('.cm-content')[0];
    await session.user.click(labelField);
    await session.user.type(labelField, 'Updated');
    await session.user.click(screen.getByText('Option value'));

    expect(isOptionPopoverOpen()).toBe(true);
    expect(column.options[1].label).toBe('UpdatedOption 2');
  });
});
