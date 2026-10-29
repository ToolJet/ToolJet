import React, { Profiler } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { unstable_batchedUpdates } from 'react-dom';
import userEvent from '@testing-library/user-event';
import { seedApp } from '@/test/app-builder';
import useTableStore from '../../../../_stores/tableStore';
import { AddNewRow } from '../AddNewRow';
import { AddNewRowForm } from '../AddNewRowForm';
import { getDatePlaceholder } from '../../../../_utils/addNewRowConfig';

const TABLE_ID = 'addrowform-table';

const COLUMNS = [
  { id: 'c1', name: 'Name', key: 'name', columnType: 'string' },
  { id: 'c2', name: 'Email', key: 'email', columnType: 'string' },
  { id: 'c3', name: 'Role', key: 'role', columnType: 'string' },
  { id: 'c4', name: 'Photo', key: 'photo', columnType: 'image' },
  { id: 'c5', name: 'Quantity', key: 'qty', columnType: 'number' },
  { id: 'c6', name: 'Open', key: 'open', columnType: 'button' },
];

const PLAN_OPTIONS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
];
const SKILL_OPTIONS = [
  { label: 'React', value: 'react' },
  { label: 'Figma', value: 'figma' },
  { label: 'SQL', value: 'sql' },
];

const OPTION_COLUMNS = [
  { id: 'o1', name: 'Plan', key: 'plan', columnType: 'select', options: PLAN_OPTIONS },
  {
    id: 'o2',
    name: 'Skills',
    key: 'skills',
    columnType: 'newMultiSelect',
    options: SKILL_OPTIONS,
    defaultOptionsList: [SKILL_OPTIONS[0]],
  },
  {
    id: 'o3',
    name: 'Tags',
    key: 'tags',
    columnType: 'tagsV2',
    options: SKILL_OPTIONS,
    allowMultipleSelection: '{{true}}',
  },
  { id: 'o4', name: 'Active', key: 'active', columnType: 'boolean' },
  { id: 'o5', name: 'Joined on', key: 'joined', columnType: 'datepicker', dateFormat: 'DD/MM/YYYY' },
];

const RICH_COLUMNS = [
  { id: 'r1', name: 'Meta', key: 'meta', columnType: 'json' },
  { id: 'r2', name: 'Bio', key: 'bio', columnType: 'html' },
  { id: 'r3', name: 'Notes', key: 'notes', columnType: 'markdown' },
];

// jsdom has no matchMedia; the form skips its fade-out for users who prefer reduced motion.
function setReducedMotion(reduce) {
  window.matchMedia = (query) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}
beforeEach(() => setReducedMotion(true));

// Radix Select and Popover lean on pointer-capture and scrollIntoView, which jsdom lacks.
beforeAll(() => {
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.setPointerCapture ||= () => {};
  Element.prototype.releasePointerCapture ||= () => {};
  Element.prototype.scrollIntoView ||= () => {};
});

const draft = () => useTableStore.getState().getAllAddNewRowDetails(TABLE_ID).get(0);

function renderForm({ columns = COLUMNS, properties = {}, fireEvent = jest.fn(), hide = jest.fn(), onCommit } = {}) {
  seedApp({});
  const store = useTableStore.getState();
  store.initializeComponent(TABLE_ID);
  store.setTableProperties(TABLE_ID, properties);
  store.setColumnDetails(TABLE_ID, columns, false, [], {}, false, [], false);
  const allColumns = columns.map((column) => ({
    columnDef: { accessorKey: column.key, meta: { columnType: column.columnType } },
  }));
  const user = userEvent.setup();
  const view = render(
    <Profiler id="add-new-row" onRender={() => onCommit?.()}>
      <AddNewRow
        id={TABLE_ID}
        hideAddNewRowPopup={hide}
        darkMode={false}
        allColumns={allColumns}
        fireEvent={fireEvent}
        setExposedVariables={jest.fn()}
      />
    </Profiler>
  );
  // The global afterEach resets every zustand store before RTL's own cleanup, which would re-render this
  // still-mounted form against an emptied store. Sessions are torn down before that reset, so unmount there.
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__ ||= [];
  globalThis.__TOOLJET_APP_BUILDER_TEST_SESSIONS__.push(async () => view.unmount());
  return { user, fireEvent, hide, ...view };
}

const field = (name) => screen.getByRole('group', { name });

describe('Table-ADDROWFORM-011 fields for the configured columns', () => {
  test('Table-ADDROWFORM-011 shows the Add row heading and a field for each selected column only', () => {
    // Break this catches: the column selection ignored, so excluded columns still show up in the form.
    renderForm({ properties: { addNewRowColumns: ['name', 'email'] } });

    expect(screen.getByRole('heading', { name: 'Add row' })).toBeInTheDocument();
    expect(field('Name')).toBeInTheDocument();
    expect(field('Email')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Role' })).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-011 with nothing stored every eligible column gets a field, except button columns', () => {
    // Break this catches: a saved app opening an empty form, or an action column rendered as a field.
    renderForm({ properties: {} });

    for (const name of ['Name', 'Email', 'Role', 'Photo', 'Quantity']) {
      expect(field(name)).toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: 'Open' })).not.toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-012 controls per column type', () => {
  test('Table-ADDROWFORM-012 a string column is a text input whose value goes into the new row', async () => {
    // Break this catches: typed text never reaching the draft that onNewRowsAdded sends.
    const { user } = renderForm();

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');

    expect(draft().name).toBe('Ada');
  });

  test('Table-ADDROWFORM-012 an image column is a URL text input, not a picture', async () => {
    // Break this catches: image columns rendering read-only, so no image URL could be entered.
    const { user } = renderForm();

    await user.type(within(field('Photo')).getByRole('textbox'), 'https://x.test/a.png');

    expect(draft().photo).toBe('https://x.test/a.png');
  });

  test('Table-ADDROWFORM-012 a number column stores a number, and null once cleared', async () => {
    // Break this catches: numbers stored as strings, or an emptied field stored as "" or 0.
    const { user } = renderForm();
    const input = within(field('Quantity')).getByRole('spinbutton');

    await user.type(input, '12');
    expect(draft().qty).toBe(12);

    await user.clear(input);
    expect(draft().qty).toBeNull();
  });
});

describe('Table-ADDROWFORM-012 number stepper', () => {
  test('Table-ADDROWFORM-012 the stepper buttons raise and lower the number, starting from empty', async () => {
    // Break this catches: stepper buttons that do nothing, or that treat an empty field as NaN.
    const { user } = renderForm();
    const quantity = within(field('Quantity'));

    await user.click(quantity.getByRole('button', { name: 'Increase' }));
    expect(draft().qty).toBe(1);

    await user.click(quantity.getByRole('button', { name: 'Increase' }));
    await user.click(quantity.getByRole('button', { name: 'Decrease' }));
    expect(draft().qty).toBe(1);
  });
});

describe('Table-ADDROWFORM-013 table popover size', () => {
  test('Table-ADDROWFORM-013 it is 66.6% wide (max 500px) and 80% high, centred in the table', () => {
    // Break this catches: the form sized from the old fixed 300px / 80% box instead of the table.
    renderForm();

    const popover = screen.getByRole('dialog', { name: 'Add row' });

    expect(popover).toHaveStyle({
      width: '66.6%',
      maxWidth: '500px',
      height: '80%',
      top: '10%',
      left: '50%',
    });
  });
});

describe('Table-ADDROWFORM-014 fixed header and footer, scrolling body', () => {
  test('Table-ADDROWFORM-014 only the fields scroll; heading and buttons sit outside the scrolling body', () => {
    // Break this catches: the buttons scrolling away with the fields, or nothing scrolling at all.
    renderForm();

    const body = document.querySelector('[data-cy="add-new-row-0"]');

    expect(body).toHaveStyle({ overflowY: 'auto' });
    expect(within(body).getByRole('group', { name: 'Name' })).toBeInTheDocument();
    expect(within(body).queryByRole('heading', { name: 'Add row' })).not.toBeInTheDocument();
    expect(within(body).queryByRole('button', { name: 'Add row' })).not.toBeInTheDocument();
    expect(within(body).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-014 there is no header close button; Cancel is the way out', () => {
    // Break this catches: the legacy "x" button reappearing next to the heading.
    renderForm();

    expect(document.querySelector('[data-cy="add-new-rows-close-button"]')).toBeNull();
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-015 payload and test hooks', () => {
  test('Table-ADDROWFORM-015 Add row sends the typed row once, holding only the included columns', async () => {
    // Break this catches: the submit not firing the event, firing twice, or sending left-out columns.
    const { user, fireEvent, hide } = renderForm({ properties: { addNewRowColumns: ['name', 'email'] } });

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('onNewRowsAdded');
    expect(hide).toHaveBeenCalledTimes(1);
    expect(draft()).toEqual({ name: 'Ada', email: '' });
  });

  test('Table-ADDROWFORM-015 Cancel closes the form, fires the cancelled event once and clears what was typed', async () => {
    // Break this catches: a cancelled draft surviving into the next time the form opens.
    const { user, fireEvent, hide } = renderForm();

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(hide).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('onAddNewRowCancelled');
    // hide is a stub here, so the form stays mounted and re-seeds a blank row; what was typed must be gone.
    expect(draft().name).toBe('');
  });

  test('Table-ADDROWFORM-015 the existing data-cy hooks are kept', () => {
    // Break this catches: renaming a hook that QA specs select on.
    renderForm();

    for (const hook of [
      'save-button',
      'discard-button',
      'add-new-rows-header',
      'add-new-row-0',
      'name-column-0',
      'email-column-0',
    ]) {
      expect(document.querySelector(`[data-cy="${hook}"]`)).not.toBeNull();
    }
    expect(document.querySelector('.table-add-new-row')).not.toBeNull();
  });
});

describe('Table-ADDROWFORM-016 Figma metrics', () => {
  // jsdom has no layout, so the Figma numbers (frame 2628:86086) are asserted through the classes that carry them.
  test('Table-ADDROWFORM-016 header and footer are 70px, the body pads 16px with 16px between fields', () => {
    // Break this catches: spacing drifting from the design (tighter header, no gap between fields).
    renderForm();
    const dialog = screen.getByRole('dialog', { name: 'Add row' });
    const header = screen.getByRole('heading', { name: 'Add row' }).parentElement;
    const footer = screen.getByRole('button', { name: 'Add row' }).parentElement;
    const body = document.querySelector('[data-cy="add-new-row-0"]');

    expect(header).toHaveClass('tw-h-[70px]');
    expect(footer).toHaveClass('tw-h-[70px]');
    expect(body).toHaveClass('tw-gap-4');
    expect(body).toHaveClass('tw-py-4');
    expect(body).toHaveClass('tw-pl-4');
    expect(dialog).toContainElement(header);
  });

  test('Table-ADDROWFORM-016 each field has a 2px inner margin and 36px controls; buttons are 36px', () => {
    // Break this catches: 32px controls or flush fields, which no longer line up with the design.
    renderForm();

    expect(field('Name')).toHaveClass('tw-p-0.5');
    expect(within(field('Name')).getByRole('textbox')).toHaveClass('tw-h-9');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('tw-h-9');
    expect(screen.getByRole('button', { name: 'Add row' })).toHaveClass('tw-h-9');
  });
});

describe('Table-ADDROWFORM-017 select field', () => {
  test('Table-ADDROWFORM-017 shows the Select placeholder and stores the chosen option value', async () => {
    // Break this catches: the picked option's label stored instead of its value, or no placeholder shown.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const trigger = within(field('Plan')).getByRole('combobox');
    expect(trigger).toHaveTextContent('Select');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Pro' }));

    expect(draft().plan).toBe('pro');
  });

  test('Table-ADDROWFORM-017 shows the column default option while nothing is chosen', () => {
    // Break this catches: the configured default option not appearing, as in the table cell.
    renderForm({
      columns: [{ ...OPTION_COLUMNS[0], defaultOptionsList: [PLAN_OPTIONS[0]] }],
    });

    expect(within(field('Plan')).getByRole('combobox')).toHaveTextContent('Free');
  });
});

describe('Table-ADDROWFORM-018 multiselect and tags fields', () => {
  test('Table-ADDROWFORM-018 options are ticked in a list and shown as removable chips', async () => {
    // Break this catches: values stored as labels, or chips that cannot be removed.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const tags = within(field('Tags'));

    await user.click(tags.getByRole('combobox'));
    await user.click(await screen.findByRole('checkbox', { name: 'Figma' }));
    await user.click(screen.getByRole('checkbox', { name: 'SQL' }));
    expect(draft().tags).toEqual(['figma', 'sql']);
    await user.keyboard('{Escape}');

    expect(tags.getByText('Figma')).toBeInTheDocument();
    await user.click(tags.getByRole('button', { name: 'Remove Figma' }));
    expect(draft().tags).toEqual(['sql']);
  });

  test('Table-ADDROWFORM-018 the clear button empties the selection', async () => {
    // Break this catches: no way to clear a multiselect in one click.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const tags = within(field('Tags'));

    await user.click(tags.getByRole('combobox'));
    await user.click(await screen.findByRole('checkbox', { name: 'React' }));
    await user.keyboard('{Escape}');
    await user.click(tags.getByRole('button', { name: 'Clear selection' }));

    expect(draft().tags).toEqual([]);
  });

  test('Table-ADDROWFORM-018 the column default options show as chips and are the starting selection', async () => {
    // Break this catches: configured defaults not appearing, or being dropped the moment another option is ticked.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const skills = within(field('Skills'));
    expect(skills.getByText('React')).toBeInTheDocument();

    await user.click(skills.getByRole('combobox'));
    await user.click(await screen.findByRole('checkbox', { name: 'SQL' }));

    expect(draft().skills).toEqual(['react', 'sql']);
  });

  test('Table-ADDROWFORM-018 tags without multiple selection behave as a single select', async () => {
    // Break this catches: a single-choice tags column offering several choices, or storing an array.
    const { user } = renderForm({ columns: [{ ...OPTION_COLUMNS[2], allowMultipleSelection: '{{false}}' }] });
    const trigger = within(field('Tags')).getByRole('combobox');
    expect(trigger).toHaveTextContent('Select');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'SQL' }));

    expect(draft().tags).toBe('sql');
  });
});

describe('Table-ADDROWFORM-019 boolean field', () => {
  test('Table-ADDROWFORM-019 is an off switch that stores true/false, with the label after it', async () => {
    // Break this catches: a boolean stored as a string, or the switch starting on.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const toggle = within(field('Active')).getByRole('switch');
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(draft().active).toBe(true);
    await user.click(toggle);
    expect(draft().active).toBe(false);

    const group = field('Active');
    const label = within(group).getByText('Active');
    expect(toggle.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Table-ADDROWFORM-020 date field placeholder', () => {
  test('Table-ADDROWFORM-020 the empty date input shows the column format as its placeholder', () => {
    // Break this catches: an empty date field with nothing to say what to type, as in the first screenshot.
    renderForm({ columns: OPTION_COLUMNS });

    expect(within(field('Joined on')).getByRole('textbox')).toHaveAttribute('placeholder', 'dd/mm/yyyy');
  });

  test.each([
    [{ dateFormat: 'MM/DD/YYYY', isTimeChecked: true }, 'mm/dd/yyyy hh:mm am'],
    [{ dateFormat: 'DD-MM-YYYY', isTimeChecked: true, isTwentyFourHrFormatEnabled: true }, 'dd-mm-yyyy hh:mm'],
    [{ dateFormat: 'DD/MM/YYYY', isTimeChecked: true, isDateSelectionEnabled: false }, 'hh:mm am'],
    [{ dateFormat: 'YYYY-MM-DD' }, 'yyyy-mm-dd'],
  ])('Table-ADDROWFORM-020 placeholder for %j is %s', (config, expected) => {
    // Break this catches: the time part missing, or 12/24 hour format ignored.
    expect(getDatePlaceholder(config)).toBe(expected);
  });
});

describe('Table-ADDROWFORM-021 the form settles instead of re-rendering forever', () => {
  const idleCommits = async (commits, ms = 300) => {
    const before = commits.count;
    await new Promise((resolve) => setTimeout(resolve, ms));
    return commits.count - before;
  };

  test('Table-ADDROWFORM-021 opening a select leaves the form idle', async () => {
    // Break this catches: the table instance getting a fresh data array every render, which makes it reset
    // its page index and re-render again and again; with a select open that froze the page.
    const commits = { count: 0 };
    const { user } = renderForm({ columns: OPTION_COLUMNS, onCommit: () => (commits.count += 1) });

    await user.click(within(field('Plan')).getByRole('combobox'));

    expect(await idleCommits(commits)).toBe(0);
  });

  test('Table-ADDROWFORM-021 opening a multiselect and ticking an option leaves the form idle', async () => {
    // Break this catches: the same endless re-render through the chips popover.
    const commits = { count: 0 };
    const { user } = renderForm({ columns: OPTION_COLUMNS, onCommit: () => (commits.count += 1) });

    await user.click(within(field('Tags')).getByRole('combobox'));
    await user.click(await screen.findByRole('checkbox', { name: 'React' }));

    expect(await idleCommits(commits)).toBe(0);
  });

  test('Table-ADDROWFORM-021 typing in a text field leaves the form idle', async () => {
    // Break this catches: any edit starting the endless re-render.
    const commits = { count: 0 };
    const { user } = renderForm({ onCommit: () => (commits.count += 1) });

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');

    expect(await idleCommits(commits)).toBe(0);
  });
});

describe('Table-ADDROWFORM-022 typography follows the table', () => {
  // The table renders IBM Plex Sans from the page body. The Inter-based `tw-font-title-*` / `tw-font-body-*`
  // utilities set their own family, and native inputs do not inherit one, so both are checked here.
  const interClasses = (root) =>
    [...root.querySelectorAll('[class]')]
      .filter((node) => /(^|\s)tw-font-(title|body|code)/.test(node.getAttribute('class')))
      .map((node) => node.getAttribute('class'));

  test('Table-ADDROWFORM-022 the form sets no Inter font family, and inputs inherit the page font', () => {
    // Break this catches: labels or inputs drawn in Inter while the table beside them is IBM Plex Sans.
    renderForm({ columns: [...COLUMNS, ...RICH_COLUMNS] });
    const dialog = screen.getByRole('dialog', { name: 'Add row' });

    expect(interClasses(dialog)).toEqual([]);
    expect(within(field('Name')).getByRole('textbox')).toHaveClass('[font-family:inherit]');
    expect(within(field('Quantity')).getByRole('spinbutton')).toHaveClass('[font-family:inherit]');
  });

  test('Table-ADDROWFORM-022 text inputs and textareas are 14px at every width, like the table text', () => {
    // Break this catches: the Rocket base input's md:text-sm winning on desktop, so values show smaller than the table.
    renderForm({ columns: [...COLUMNS, ...RICH_COLUMNS] });

    for (const [name, role] of [
      ['Name', 'textbox'],
      ['Photo', 'textbox'],
      ['Meta', 'textbox'],
      ['Bio', 'textbox'],
      ['Notes', 'textbox'],
    ]) {
      const control = within(field(name)).getByRole(role);
      expect(control).toHaveClass('tw-text-lg');
      expect(control).toHaveClass('md:tw-text-lg');
    }
  });

  test('Table-ADDROWFORM-022 the open select and multiselect lists set no Inter font family either', async () => {
    // Break this catches: option rows in a different font and size from the table's own text.
    const { user } = renderForm({ columns: OPTION_COLUMNS });

    await user.click(within(field('Plan')).getByRole('combobox'));
    expect(interClasses(await screen.findByRole('listbox'))).toEqual([]);
    await user.keyboard('{Escape}');

    await user.click(within(field('Tags')).getByRole('combobox'));
    expect(interClasses(await screen.findByRole('listbox'))).toEqual([]);
  });
});

describe('Table-ADDROWFORM-023 JSON field', () => {
  test('Table-ADDROWFORM-023 is editable, and valid JSON is stored as a compact JSON string once it loses focus', async () => {
    // Break this catches: a JSON field that cannot be typed into, or one that stores pretty-printed text.
    const { user } = renderForm({ columns: RICH_COLUMNS });
    const meta = within(field('Meta')).getByRole('textbox');

    await user.click(meta);
    await user.paste('{ "a": 1,\n  "b": [2, 3] }');
    await user.click(within(field('Bio')).getByRole('textbox'));

    expect(draft().meta).toBe('{"a":1,"b":[2,3]}');
  });

  test('Table-ADDROWFORM-023 invalid JSON stays in the draft as typed, for validation to flag later', async () => {
    // Break this catches: invalid text silently dropped, so the field looks filled but sends nothing.
    const { user } = renderForm({ columns: RICH_COLUMNS });

    await user.click(within(field('Meta')).getByRole('textbox'));
    await user.paste('{ "a": ');
    await user.click(within(field('Bio')).getByRole('textbox'));

    expect(draft().meta).toBe('{ "a": ');
  });
});

describe('Table-ADDROWFORM-024 HTML and Markdown fields', () => {
  test('Table-ADDROWFORM-024 HTML shows its raw text while editing and renders once you click away', async () => {
    // Break this catches: the user never seeing the rendered result of what they typed.
    const { user } = renderForm({ columns: RICH_COLUMNS });
    const bio = within(field('Bio'));

    await user.click(bio.getByRole('textbox'));
    await user.paste('<b>bold</b> text');
    expect(bio.getByRole('textbox')).toHaveValue('<b>bold</b> text');

    await user.click(within(field('Notes')).getByRole('textbox'));

    expect(bio.queryByRole('textbox')).not.toBeInTheDocument();
    expect(bio.getByText('bold').tagName).toBe('B');
    expect(draft().bio).toBe('<b>bold</b> text');
  });

  test('Table-ADDROWFORM-024 clicking the rendered HTML goes back to editing the raw text', async () => {
    // Break this catches: rendered content that can no longer be edited.
    const { user } = renderForm({ columns: RICH_COLUMNS });
    const bio = within(field('Bio'));

    await user.click(bio.getByRole('textbox'));
    await user.paste('<i>slanted</i>');
    await user.click(within(field('Notes')).getByRole('textbox'));
    await user.click(bio.getByText('slanted'));

    expect(bio.getByRole('textbox')).toHaveValue('<i>slanted</i>');
  });

  test('Table-ADDROWFORM-024 HTML is sanitised when rendered', async () => {
    // Break this catches: script or event-handler markup typed into the field being rendered live.
    const { user } = renderForm({ columns: RICH_COLUMNS });
    const bio = within(field('Bio'));

    await user.click(bio.getByRole('textbox'));
    await user.paste('<img src=x onerror="window.__pwned=1"><b>ok</b>');
    await user.click(within(field('Notes')).getByRole('textbox'));

    expect(bio.getByText('ok')).toBeInTheDocument();
    expect(field('Bio').querySelector('[onerror]')).toBeNull();
  });

  test('Table-ADDROWFORM-024 Markdown renders its text once you click away', async () => {
    // Break this catches: Markdown left as raw text after editing.
    const { user } = renderForm({ columns: RICH_COLUMNS });
    const notes = within(field('Notes'));

    await user.click(notes.getByRole('textbox'));
    await user.paste('**hello** world');
    await user.click(within(field('Bio')).getByRole('textbox'));

    expect(notes.queryByRole('textbox')).not.toBeInTheDocument();
    expect(notes.getByText(/hello/)).toBeInTheDocument();
    expect(draft().notes).toBe('**hello** world');
  });
});

describe('Table-ADDROWFORM-025 option menu matches the table select menu', () => {
  // The table styles its select menu through these class names (table-component.scss), so using the same markup
  // gives the same fonts, 12px 8px row padding, pills and hover colours, in light and dark.
  const menuOf = async () => (await screen.findByRole('listbox')).closest('.table-select-custom-menu-list');

  test('Table-ADDROWFORM-025 a select opens the table-style menu: search box, option rows, pills', async () => {
    // Break this catches: a menu built from other markup, so its padding, fonts and pills differ from the table's.
    const { user } = renderForm({ columns: OPTION_COLUMNS });

    await user.click(within(field('Plan')).getByRole('combobox'));
    const menu = await menuOf();

    expect(menu).not.toBeNull();
    expect(within(menu).getByPlaceholderText('Search...')).toHaveClass('table-select-column-type-search-box');
    const rows = within(menu).getAllByRole('option');
    expect(rows.map((row) => row.textContent)).toEqual(['Free', 'Pro']);
    for (const row of rows) {
      expect(row).toHaveClass('option-wrapper');
      expect(row.querySelector('.table-select-menu-pill')).not.toBeNull();
    }
  });

  test('Table-ADDROWFORM-025 picking an option closes the menu, and picking the selected one again clears it', async () => {
    // Break this catches: a single select that stays open, or one that cannot be cleared the way the table's can.
    const { user } = renderForm({ columns: OPTION_COLUMNS });
    const trigger = within(field('Plan')).getByRole('combobox');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Pro' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(draft().plan).toBe('pro');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Pro' }));
    expect(draft().plan).toBe('');
  });

  test('Table-ADDROWFORM-025 only the selected row of a single select shows its checkbox; every row of a multiselect does', async () => {
    // Break this catches: ticks showing on unselected single-select rows, or missing on multiselect rows.
    const { user } = renderForm({ columns: OPTION_COLUMNS });

    await user.click(within(field('Plan')).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Pro' }));
    await user.click(within(field('Plan')).getByRole('combobox'));
    const planRows = within(await menuOf()).getAllByRole('option');
    expect(planRows.map((row) => row.querySelector('[data-slot="checkbox"]').parentElement.style.visibility)).toEqual([
      'hidden',
      'visible',
    ]);
    await user.keyboard('{Escape}');

    await user.click(within(field('Tags')).getByRole('combobox'));
    const tagRows = within(await menuOf()).getAllByRole('option');
    expect(tagRows.map((row) => row.querySelector('[data-slot="checkbox"]').parentElement.style.visibility)).toEqual([
      'visible',
      'visible',
      'visible',
    ]);
  });

  test('Table-ADDROWFORM-025 the search box narrows the options, and says so when nothing matches', async () => {
    // Break this catches: a search box that does nothing.
    const { user } = renderForm({ columns: OPTION_COLUMNS });

    await user.click(within(field('Tags')).getByRole('combobox'));
    const menu = await menuOf();
    await user.type(within(menu).getByPlaceholderText('Search...'), 'sq');
    expect(
      within(menu)
        .getAllByRole('option')
        .map((row) => row.textContent)
    ).toEqual(['SQL']);

    await user.clear(within(menu).getByPlaceholderText('Search...'));
    await user.type(within(menu).getByPlaceholderText('Search...'), 'zzz');
    expect(within(menu).queryAllByRole('option')).toHaveLength(0);
    expect(within(menu).getByText('No options')).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-025 the configured option colours show on the pills', async () => {
    // Break this catches: option colours set on the column being ignored in the form.
    const { user } = renderForm({
      columns: [
        {
          ...OPTION_COLUMNS[0],
          options: [{ label: 'Free', value: 'free', optionColor: 'rgb(1, 2, 3)', labelColor: 'rgb(4, 5, 6)' }],
        },
      ],
    });

    await user.click(within(field('Plan')).getByRole('combobox'));
    const pill = (await screen.findByRole('option', { name: 'Free' })).querySelector('.table-select-menu-pill');

    expect(pill).toHaveStyle({ background: 'rgb(1, 2, 3)', color: 'rgb(4, 5, 6)' });
  });
});

describe('Table-ADDROWFORM-026 asterisk on fields that have validation', () => {
  const VALIDATED_COLUMNS = [
    { id: 'v1', name: 'Code', key: 'code', columnType: 'string', minLength: '3' },
    { id: 'v2', name: 'Age', key: 'age', columnType: 'number', maxValue: '120' },
    { ...OPTION_COLUMNS[0], customRule: '{{cellValue !== "free"}}' },
    { ...OPTION_COLUMNS[4], minDate: '01/01/2020' },
    { id: 'v3', name: 'Nickname', key: 'nickname', columnType: 'string', minLength: '', maxLength: '' },
    { id: 'v4', name: 'City', key: 'city', columnType: 'string' },
  ];
  const asterisk = (name) => within(field(name)).queryByText('*');

  test('Table-ADDROWFORM-026 fields whose column has a min, max or custom rule are marked with a red *', () => {
    // Break this catches: users not being able to tell which fields will be validated.
    renderForm({ columns: VALIDATED_COLUMNS });

    for (const name of ['Code', 'Age', 'Plan', 'Joined on']) {
      expect(asterisk(name)).toBeInTheDocument();
      expect(asterisk(name)).toHaveClass('tw-text-text-danger');
    }
  });

  test('Table-ADDROWFORM-026 fields without a rule, or with empty rule settings, are not marked', () => {
    // Break this catches: a * on every field, or on fields whose rule settings were left blank.
    renderForm({ columns: VALIDATED_COLUMNS });

    expect(asterisk('Nickname')).not.toBeInTheDocument();
    expect(asterisk('City')).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-026 the * is decoration: it does not change the field name', () => {
    // Break this catches: screen readers hearing "Code star", or the field no longer found by its label.
    renderForm({ columns: VALIDATED_COLUMNS });

    expect(within(field('Code')).getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(field('Code')).toBeInTheDocument();
  });

  test.each(['stacked', 'label-after', 'label-before'])(
    'Table-ADDROWFORM-026 the form shell draws the * in the %s label layout',
    (layout) => {
      // Break this catches: the marker missing when the label sits after a switch or before a radio group.
      render(
        <AddNewRowForm
          darkMode={false}
          onSubmit={() => {}}
          onCancel={() => {}}
          fields={[
            {
              key: 'f1',
              label: 'Field',
              labelId: 'f1-label',
              dataCy: 'field-column-0',
              headerDataCy: 'field-column-header',
              layout,
              hasValidation: true,
              control: <input aria-labelledby="f1-label" />,
            },
          ]}
        />
      );

      expect(within(screen.getByRole('group', { name: 'Field' })).getByText('*')).toBeInTheDocument();
    }
  );
});

describe('Table-ADDROWFORM-027 validation runs on Add row', () => {
  const CODE = { id: 'v1', name: 'Code', key: 'code', columnType: 'string', minLength: '3' };
  const AGE = { id: 'v2', name: 'Age', key: 'age', columnType: 'number', maxValue: '120' };
  const FREE = { id: 'v3', name: 'City', key: 'city', columnType: 'string' };
  const message = (name) => within(field(name)).queryByRole('alert');

  test('Table-ADDROWFORM-027 no message shows before Add row is clicked', () => {
    // Break this catches: the form opening already covered in errors for fields nobody has touched.
    renderForm({ columns: [CODE, AGE, FREE] });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(within(field('Code')).getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('Table-ADDROWFORM-027 an invalid value blocks Add row, keeps the form open and shows the table message', async () => {
    // Break this catches: invalid rows being sent, or the form closing over unfixed errors.
    const { user, fireEvent, hide } = renderForm({ columns: [CODE, FREE] });

    await user.type(within(field('Code')).getByRole('textbox'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
    expect(message('Code')).toHaveTextContent('Minimum 3 characters is needed');
    expect(within(field('Code')).getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(within(field('City')).queryByRole('alert')).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-027 a field with a rule cannot be left empty if the rule needs a value', async () => {
    // Break this catches: a * field passing validation because nothing was typed.
    const { user, fireEvent } = renderForm({ columns: [CODE] });

    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(message('Code')).toHaveTextContent('Minimum 3 characters is needed');
  });

  test('Table-ADDROWFORM-027 every invalid field shows its own message at once', async () => {
    // Break this catches: only the first error being reported, so the user fixes one at a time.
    const { user } = renderForm({ columns: [CODE, AGE] });

    await user.type(within(field('Code')).getByRole('textbox'), 'ab');
    await user.type(within(field('Age')).getByRole('spinbutton'), '130');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(message('Code')).toHaveTextContent('Minimum 3 characters is needed');
    expect(message('Age')).toHaveTextContent('Maximum value is 120');
  });

  test('Table-ADDROWFORM-027 focus moves to the first invalid field', async () => {
    // Break this catches: the user having to hunt for what blocked the save.
    const { user } = renderForm({ columns: [FREE, CODE, AGE] });

    await user.type(within(field('Age')).getByRole('spinbutton'), '130');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(within(field('Code')).getByRole('textbox')).toHaveFocus();
  });

  test('Table-ADDROWFORM-027 after a failed attempt the message follows the edits, and a valid form is sent once', async () => {
    // Break this catches: stale messages after fixing a value, or a fixed form still refusing to send.
    const { user, fireEvent, hide } = renderForm({ columns: [CODE, FREE] });
    const code = within(field('Code')).getByRole('textbox');

    await user.type(code, 'ab');
    await user.click(screen.getByRole('button', { name: 'Add row' }));
    expect(message('Code')).toBeInTheDocument();

    await user.type(code, 'c');
    expect(message('Code')).not.toBeInTheDocument();
    expect(code).not.toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', { name: 'Add row' }));
    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('onNewRowsAdded');
    expect(hide).toHaveBeenCalledTimes(1);
    expect(draft().code).toBe('abc');
  });

  test('Table-ADDROWFORM-027 a regex rule and a custom rule show their messages', async () => {
    // Break this catches: rules other than min/max being skipped.
    const { user } = renderForm({
      columns: [
        { id: 'v4', name: 'Slug', key: 'slug', columnType: 'string', regex: '^[a-z]+$' },
        {
          id: 'v5',
          name: 'Pin',
          key: 'pin',
          columnType: 'string',
          customRule: '{{cellValue === "1234" ? "" : "Pin must be 1234"}}',
        },
      ],
    });

    await user.type(within(field('Slug')).getByRole('textbox'), 'ABC');
    await user.type(within(field('Pin')).getByRole('textbox'), '9');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(message('Slug')).toHaveTextContent('The input should match pattern');
    expect(message('Pin')).toHaveTextContent('Pin must be 1234');
  });

  test('Table-ADDROWFORM-027 select, multiselect and date columns are validated too', async () => {
    // Break this catches: only text and number fields being checked.
    const { user, fireEvent } = renderForm({
      columns: [
        { ...OPTION_COLUMNS[0], customRule: '{{cellValue === "pro" ? "" : "Pick Pro"}}' },
        { ...OPTION_COLUMNS[2], customRule: '{{cellValue.length > 1 ? "" : "Pick two"}}' },
        { ...OPTION_COLUMNS[4], minDate: '01/01/2020' },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).not.toHaveBeenCalled();
    expect(message('Plan')).toHaveTextContent('Pick Pro');
    expect(message('Tags')).toHaveTextContent('Pick two');
    expect(message('Joined on')).toHaveTextContent('Minimum date is 01/01/2020');
  });

  test('Table-ADDROWFORM-027 fields without a rule never block Add row', async () => {
    // Break this catches: unvalidated fields being treated as invalid.
    const { user, fireEvent } = renderForm({ columns: [FREE] });

    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Table-ADDROWFORM-028 dialog placement', () => {
  const dialogProps = { addNewRowIn: 'dialog' };

  test('Table-ADDROWFORM-028 the dialog renders outside the table, with the same form in it', () => {
    // Break this catches: the dialog still drawn inside the table box, clipped by it.
    const { container } = renderForm({ properties: dialogProps });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const dialog = screen.getByRole('dialog', { name: 'Add row' });
    expect(document.body).toContainElement(dialog);
    expect(within(dialog).getByRole('group', { name: 'Name' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add row' })).toBeInTheDocument();
    expect(dialog.closest('.table-add-new-row') ?? dialog.querySelector('.table-add-new-row')).not.toBeNull();
  });

  test('Table-ADDROWFORM-028 the table placement stays inside the table', () => {
    // Break this catches: every table opening a dialog, whatever its setting.
    const { container } = renderForm({ properties: { addNewRowIn: 'table' } });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
  });

  test('Table-ADDROWFORM-028 the dialog is 500px wide and at most min(80vh, 720px) tall, whatever the table size', () => {
    // Break this catches: the dialog following the table size, or growing past the screen.
    renderForm({ properties: dialogProps });

    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content).toHaveClass('tw-max-w-[500px]');
    expect(content).toHaveClass('tw-max-h-[min(80vh,720px)]');
  });

  test('Table-ADDROWFORM-028 select and multiselect menus open above the dialog', async () => {
    // Break this catches: a menu opening behind the dialog (the builder puts Rocket dialogs at z-index 1050).
    const { user } = renderForm({ columns: OPTION_COLUMNS, properties: dialogProps });

    await user.click(within(field('Plan')).getByRole('combobox'));

    const menuLayer = (await screen.findByRole('listbox')).closest('[data-slot="popover-content"]');
    expect(menuLayer).toHaveClass('tw-z-[1060]');
  });

  test('Table-ADDROWFORM-028 typing and Add row work the same in the dialog', async () => {
    // Break this catches: the dialog showing the form but not wired to the draft and the send.
    const { user, fireEvent, hide } = renderForm({ properties: dialogProps });

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(draft().name).toBe('Ada');
    expect(fireEvent).toHaveBeenCalledWith('onNewRowsAdded');
    expect(hide).toHaveBeenCalledTimes(1);
  });
});

describe('Table-ADDROWFORM-029 Escape and outside clicks', () => {
  test.each([['table'], ['dialog']])(
    'Table-ADDROWFORM-029 Escape in the %s placement acts like Cancel',
    async (placement) => {
      // Break this catches: Escape doing nothing, or closing without the cancelled event and the draft reset.
      const { user, fireEvent, hide } = renderForm({ properties: { addNewRowIn: placement } });

      await user.type(within(field('Name')).getByRole('textbox'), 'Ada');
      await user.keyboard('{Escape}');

      expect(hide).toHaveBeenCalledTimes(1);
      expect(fireEvent).toHaveBeenCalledTimes(1);
      expect(fireEvent).toHaveBeenCalledWith('onAddNewRowCancelled');
      expect(draft().name).toBe('');
    }
  );

  test('Table-ADDROWFORM-029 clicking the dialog backdrop does not close it', async () => {
    // Break this catches: an accidental click outside throwing away a half-filled form.
    const { user, fireEvent, hide } = renderForm({ properties: { addNewRowIn: 'dialog' } });

    await user.click(document.querySelector('[data-slot="dialog-overlay"]'));

    expect(hide).not.toHaveBeenCalled();
    expect(fireEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Add row' })).toBeInTheDocument();
  });

  test('Table-ADDROWFORM-029 Escape that closes an open select menu does not also cancel the form', async () => {
    // Break this catches: dismissing a dropdown throwing the whole form away.
    const { user, fireEvent, hide } = renderForm({ columns: OPTION_COLUMNS });

    await user.click(within(field('Plan')).getByRole('combobox'));
    await screen.findByRole('listbox');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(hide).not.toHaveBeenCalled();
    expect(fireEvent).not.toHaveBeenCalled();
  });
});

describe('Table-ADDROWFORM-030 dialog focus', () => {
  test('Table-ADDROWFORM-030 focus moves into the dialog when it opens', async () => {
    // Break this catches: focus staying on the page behind the dialog.
    renderForm({ properties: { addNewRowIn: 'dialog' } });

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Add row' }).contains(document.activeElement)).toBe(true)
    );
  });

  test('Table-ADDROWFORM-030 focus returns to what opened the dialog once it closes', async () => {
    // Break this catches: keyboard users landing back at the top of the page after closing the dialog.
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    let unmount;
    const { user, unmount: unmountForm } = renderForm({
      properties: { addNewRowIn: 'dialog' },
      hide: () => unmount(),
    });
    unmount = unmountForm;

    await user.keyboard('{Escape}');

    await waitFor(() => expect(opener).toHaveFocus());
    opener.remove();
  });
});

describe('Table-ADDROWFORM-032 saving state', () => {
  const NAME = { id: 's1', name: 'Name', key: 'name', columnType: 'string' };
  const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  const send = (user) => user.click(screen.getByRole('button', { name: 'Add row' }));

  test('Table-ADDROWFORM-032 while the app handles the event the form shows Adding row… and locks', async () => {
    // Break this catches: no sign that the row is being added, and fields that stay editable mid-save.
    const pending = deferred();
    const { user, hide } = renderForm({ columns: [NAME], fireEvent: jest.fn(() => pending.promise) });

    await user.type(within(field('Name')).getByRole('textbox'), 'Ada');
    await send(user);

    const saving = screen.getByRole('button', { name: 'Adding row…' });
    expect(saving).toBeDisabled();
    expect(saving).toHaveClass('tw-opacity-60');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('tw-opacity-50');
    expect(within(field('Name')).getByRole('textbox')).toBeDisabled();
    expect(document.querySelector('[data-cy="add-new-row-0"]')).toHaveAttribute('inert');
    expect(hide).not.toHaveBeenCalled();

    pending.resolve();
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test('Table-ADDROWFORM-032 a second click while saving does not send the row twice', async () => {
    // Break this catches: a double click adding the row twice.
    const pending = deferred();
    const { user, fireEvent, hide } = renderForm({ columns: [NAME], fireEvent: jest.fn(() => pending.promise) });

    await send(user);
    await user.click(screen.getByRole('button', { name: 'Adding row…' }));
    await user.keyboard('{Enter}');

    expect(fireEvent).toHaveBeenCalledTimes(1);
    pending.resolve();
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test('Table-ADDROWFORM-032 two clicks in the same instant still send the row once', async () => {
    // Break this catches: a double click slipping through before the button has re-rendered as disabled.
    const pending = deferred();
    const { fireEvent } = renderForm({ columns: [NAME], fireEvent: jest.fn(() => pending.promise) });
    const button = screen.getByRole('button', { name: 'Add row' });

    act(() => {
      unstable_batchedUpdates(() => {
        button.click();
        button.click();
      });
    });

    expect(fireEvent).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve());
  });

  test('Table-ADDROWFORM-032 a Cancel in the same instant as Add row does not cancel the row', async () => {
    // Break this catches: Cancel winning a race against a send that has already started.
    const pending = deferred();
    const { fireEvent } = renderForm({ columns: [NAME], fireEvent: jest.fn(() => pending.promise) });

    act(() => {
      unstable_batchedUpdates(() => {
        screen.getByRole('button', { name: 'Add row' }).click();
        screen.getByRole('button', { name: 'Cancel' }).click();
      });
    });

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).not.toHaveBeenCalledWith('onAddNewRowCancelled');
    await act(async () => pending.resolve());
  });

  test('Table-ADDROWFORM-032 Escape and Cancel are ignored while saving', async () => {
    // Break this catches: cancelling a row that is already on its way to the app.
    const pending = deferred();
    const { user, fireEvent, hide } = renderForm({ columns: [NAME], fireEvent: jest.fn(() => pending.promise) });

    await send(user);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(fireEvent).toHaveBeenCalledTimes(1);
    expect(fireEvent).not.toHaveBeenCalledWith('onAddNewRowCancelled');
    expect(hide).not.toHaveBeenCalled();
    pending.resolve();
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test("Table-ADDROWFORM-032 the form closes when the handler fails too, and the failure is the app's to handle", async () => {
    // Break this catches: a failed handler leaving the form stuck in "Adding row…" for ever.
    const failing = jest.fn(() => Promise.reject(new Error('query failed')));
    const { user, hide } = renderForm({ columns: [NAME], fireEvent: failing });

    await send(user);

    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test('Table-ADDROWFORM-032 a form the app has already closed is not closed a second time', async () => {
    // Break this catches: the form calling hide again after a handler closed it (e.g. discardNewlyAddedRows).
    const pending = deferred();
    let unmount;
    const hide = jest.fn();
    const { user, unmount: unmountForm } = renderForm({
      columns: [NAME],
      fireEvent: jest.fn(() => pending.promise),
      hide,
    });
    unmount = unmountForm;

    await send(user);
    unmount();
    pending.resolve();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(hide).not.toHaveBeenCalled();
  });

  test('Table-ADDROWFORM-032 an invalid form never enters the saving state', async () => {
    // Break this catches: a blocked send still showing "Adding row…" and locking the form.
    const { user, fireEvent } = renderForm({
      columns: [{ ...NAME, minLength: '3' }],
      fireEvent: jest.fn(() => Promise.resolve()),
    });

    await send(user);

    expect(fireEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add row' })).toBeEnabled();
    expect(within(field('Name')).getByRole('textbox')).toBeEnabled();
  });
});

describe('Table-ADDROWFORM-033 fade out', () => {
  test('Table-ADDROWFORM-033 after a send the form fades out, then closes', async () => {
    // Break this catches: the form vanishing abruptly instead of fading, as in the design notes.
    setReducedMotion(false);
    const { user, hide } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add row' }));

    const popover = screen.getByRole('dialog', { name: 'Add row' });
    expect(popover).toHaveStyle({ opacity: '0' });
    expect(hide).not.toHaveBeenCalled();
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test('Table-ADDROWFORM-033 Cancel fades out the same way', async () => {
    // Break this catches: Cancel closing differently from Add row ("same as Save" in the design).
    setReducedMotion(false);
    const { user, hide, fireEvent } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(fireEvent).toHaveBeenCalledWith('onAddNewRowCancelled');
    expect(screen.getByRole('dialog', { name: 'Add row' })).toHaveStyle({ opacity: '0' });
    await waitFor(() => expect(hide).toHaveBeenCalledTimes(1));
  });

  test('Table-ADDROWFORM-033 with reduced motion it closes at once, without fading', async () => {
    // Break this catches: users who asked for less motion still getting a fade.
    setReducedMotion(true);
    const { user, hide } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Add row' }));

    expect(hide).toHaveBeenCalledTimes(1);
  });
});

describe('Table-ADDROWFORM-035 a JSON column does not add fields for its keys', () => {
  const NESTED = [
    { id: 'n1', name: 'name', key: 'name', columnType: 'string' },
    { id: 'n2', name: 'metadata', key: 'metadata', columnType: 'json' },
    { id: 'n3', name: 'metadata.team', key: 'metadata.team', columnType: 'string', autogenerated: true },
    { id: 'n4', name: 'metadata.level', key: 'metadata.level', columnType: 'string', autogenerated: true },
  ];

  test('Table-ADDROWFORM-035 the form shows the JSON field only', () => {
    // Break this catches: "metadata.team" and "metadata.level" appearing next to the JSON field.
    renderForm({ columns: NESTED });

    expect(field('metadata')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'metadata.team' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'metadata.level' })).not.toBeInTheDocument();
  });

  test('Table-ADDROWFORM-035 the row sent holds no dotted keys, so it cannot overwrite the JSON value', async () => {
    // Break this catches: nested columns being turned into an object that replaces what was typed in the JSON field.
    const { user } = renderForm({ columns: NESTED });

    await user.click(within(field('metadata')).getByRole('textbox'));
    await user.paste('{"team":"a","level":3}');
    await user.click(within(field('name')).getByRole('textbox'));

    expect(Object.keys(draft())).toEqual(['name', 'metadata']);
    expect(draft().metadata).toBe('{"team":"a","level":3}');
  });
});

describe('Table-ADDROWFORM-036 date picker popup in the dialog', () => {
  test('Table-ADDROWFORM-036 the calendar opens inside the dialog, so it is above it and can be clicked', async () => {
    // Break this catches: the calendar rendering in the editor's portal, beneath the dialog and blocked by it.
    const { user } = renderForm({ columns: OPTION_COLUMNS, properties: { addNewRowIn: 'dialog' } });

    await user.click(within(field('Joined on')).getByRole('textbox'));

    const popper = await waitFor(() => {
      const found = document.querySelector('.react-datepicker-popper');
      if (!found) throw new Error('calendar not open');
      return found;
    });
    expect(screen.getByRole('dialog', { name: 'Add row' }).contains(popper)).toBe(true);
  });

  test('Table-ADDROWFORM-036 picking a day in the dialog calendar fills the field', async () => {
    // Break this catches: a calendar that opens but cannot be used from inside the modal dialog.
    const { user } = renderForm({ columns: OPTION_COLUMNS, properties: { addNewRowIn: 'dialog' } });
    const input = within(field('Joined on')).getByRole('textbox');

    await user.click(input);
    const day = await waitFor(() => {
      const found = document.querySelector('.react-datepicker__day:not(.react-datepicker__day--outside-month)');
      if (!found) throw new Error('no day');
      return found;
    });
    await user.click(day);

    expect(input.value).not.toBe('');
    expect(draft().joined).not.toBe('');
  });
});
