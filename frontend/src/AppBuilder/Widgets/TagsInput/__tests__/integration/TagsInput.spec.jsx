/**
 * TagsInput: the approved contract in
 * frontend/ee/test/app-builder/widgets/TagsInput/TESTING.md, exercised through
 * the real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real TagsInput + its react-select shell
 * (TagsInputChip/MenuList/Option/ValueContainer). Nothing about the widget is
 * mocked.
 *
 * Why the RTL layer: every guarantee here is "what a user's interaction puts
 * into `components.tagsinput1.values` / `.selectedTags` / `.newTagsAdded`", and
 * only the widget — which owns its selection state, not the store — can answer
 * that. The store is read after each real interaction.
 *
 * Deliberately NOT duplicated here: the `mandatory`/`customRule` validator
 * engine itself (store-level, validateWidget.spec.js), tooltips and
 * `collapseWhenHidden`/`cssClass` (RenderWidget-level, shared by ~50 widgets).
 * What this file adds is whether each of those is reachable by a *user* of this
 * widget.
 *
 * Test titles carry their approved scenario ID as a `[TagsInput-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor, fireEvent as rtlFireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  option,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tags1';
const NAME = 'tagsinput1';

/**
 * Baseline is `TagsInput.js`'s own `definition.properties`, copied rather than
 * invented. Two of them bite:
 *  - `options` is the STATIC tag list and is not a declared schema key at all
 *    (it lives only in `definition.properties`); omitting it renders a widget
 *    with no tags and quietly turns every selection test into a create test.
 *  - `values` — not `value` — is where per-option "mark as default" is
 *    persisted (contract D-02); `value` is dead config and is deliberately
 *    absent here.
 */
const widget = createWidgetHarness({
  componentType: 'TagsInput',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Tags'),
    placeholder: binding('Add or select a tag'),
    advanced: binding('{{false}}'),
    allowNewTags: binding('{{true}}'),
    sort: binding('none'),
    optionsLoadingState: binding('{{false}}'),
    dynamicHeight: binding('{{true}}'),
    enableSearch: binding('{{true}}'),
    serverSideSearch: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    values: binding([]),
    options: binding([option('Newport', 'newport'), option('New York', 'new_york')]),
  },
  defaultStyles: {
    auto: binding('{{true}}'),
    labelWidth: binding('33'),
    widthType: binding('ofComponent'),
    alignment: binding('side'),
    direction: binding('left'),
    labelFontSize: binding('{{12}}'),
    autoPickChipColor: binding('{{true}}'),
    tagBackgroundColor: binding('var(--cc-surface3-surface)'),
    selectedTextColor: binding('var(--cc-primary-text)'),
    errTextColor: binding('rgb(200, 0, 0)'),
    fieldBorderRadius: binding('6'),
    padding: binding('default'),
  },
});

const user = () => widget.session.user;
const widgetRoot = () => document.querySelector('.tags-input-widget');
const field = () => document.querySelector('.tags-input-widget > div.px-0');
const input = () => document.querySelector(`#component-${ID} input`);
const menu = () => document.getElementById(`tags-input-menu-${ID}`);
const menuOptions = () => [...document.querySelectorAll('.tags-input-option-chip')].map((n) => n.textContent);
const createFooter = () => document.querySelector('.tags-input-create-footer');
const chips = () => [...document.querySelectorAll('.tags-input-chip-label')].map((n) => n.textContent);
const chipNodes = () => [...document.querySelectorAll('.tags-input-chip')];
const exposed = (key) => widget.exposed()?.[key];
const errorText = () =>
  [...document.querySelectorAll('.tags-input-widget ~ div, div')]
    .map((n) => (n.style?.color === 'rgb(200, 0, 0)' ? n.textContent : null))
    .find(Boolean) ?? null;

async function mount(options = {}) {
  widget.render(options);
  await waitFor(() => expect(widgetRoot()).toBeInTheDocument());
}

async function openMenu() {
  await user().click(field());
  await waitFor(() => expect(menu()).toBeInTheDocument());
}

async function typeText(text) {
  await user().type(input(), text);
}

async function clickOption(label) {
  const node = [...document.querySelectorAll('.tags-input-option-chip')].find((n) => n.textContent === label);
  await user().click(node);
}

/**
 * A real handler wired the way a builder wires one, but counting instead of
 * writing a constant: a constant write proves at-least-once and passes on a
 * double fire, which is exactly the regression a second code path into
 * `fireEvent` would ship.
 */
const countingEvent = (eventId, key) => [
  {
    id: `evt-${eventId}`,
    index: 0,
    sourceId: ID,
    name: `evt-${eventId}`,
    target: 'component',
    event: {
      eventId,
      actionId: 'set-custom-variable',
      key,
      value: `{{(variables.${key} ?? 0) + 1}}`,
    },
  },
];

const fireCount = (key) => store().getVariable(key, MODULE_ID) ?? 0;

const SCHEMA_THREE = `{{[
  {label: 'Alpha', value: 'a', visible: true, default: true, disable: false},
  {label: 'Beta', value: 'b', visible: false, default: false, disable: false},
  {label: 'Gamma', value: 'g', visible: true, default: false, disable: false}
]}}`;

describe('TagsInput: what renders on load', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-DEF-001] renders its configured label and placeholder, and exposes the label', async () => {
    // Break this catches: dropping `label`/`placeholder` from the props passed
    // to Label/CreatableSelect, or the `setExposedVariable('label', ...)` write.
    await mount({ properties: { label: binding('Categories'), placeholder: binding('Pick a category') } });

    expect(widgetRoot().textContent).toContain('Categories');
    expect(document.querySelector(`#component-${ID}`).textContent).toContain('Pick a category');
    await waitFor(() => expect(exposed('label')).toBe('Categories'));
  });

  test('[TagsInput-DEF-002] offers the configured static tags and publishes them as `tags`', async () => {
    // Break this catches: reading the options from the wrong property, dropping
    // the `visible` filter, or exposing `allOptions` (which would leak
    // session-created tags into `tags` — contract D-04).
    await mount({
      properties: {
        options: binding([option('Newport', 'newport'), option('Hidden', 'hidden', { visible: false })]),
      },
    });

    await openMenu();

    expect(menuOptions()).toEqual(['Newport']);
    // `tags` is built from the same post-`visible` list the menu renders, so an
    // option a builder hid is absent from both.
    expect(exposed('tags')).toEqual([{ label: 'Newport', value: 'newport' }]);
  });

  test('[TagsInput-DEF-003] preselects the tags marked as default and publishes them as `values` and `selectedTags`', async () => {
    // Break this catches: reading defaults from the dead `value` key instead of
    // `values`, or publishing only one of the two exposed shapes.
    await mount({
      properties: {
        values: binding(['new_york']),
        options: binding([option('Newport', 'newport'), option('New York', 'new_york')]),
      },
    });

    await waitFor(() => expect(chips()).toEqual(['New York']));
    expect(exposed('values')).toEqual(['new_york']);
    expect(exposed('selectedTags')).toEqual([{ label: 'New York', value: 'new_york' }]);
  });

  test('[TagsInput-DEF-004] with Dynamic tags on, the schema supplies the options and only visible defaults preselect', async () => {
    // Break this catches: ignoring `advanced` (falling back to the static
    // options), dropping the `visible` filter, or preselecting every `default`
    // entry including the invisible one.
    await mount({ properties: { advanced: binding('{{true}}'), schema: binding(SCHEMA_THREE) } });

    await waitFor(() => expect(chips()).toEqual(['Alpha']));
    await openMenu();
    expect(menuOptions()).toEqual(['Gamma']);
    expect(exposed('values')).toEqual(['a']);
  });

  test('[TagsInput-DEF-005] an unsafe schema renders an empty menu instead of crashing', async () => {
    // Break this catches: removing the `Array.isArray` guard around the schema
    // (a still-loading query binding becomes a render crash) or dropping
    // `getSafeRenderableValue` around the label (a query returning an object in
    // the label column throws "Objects are not valid as a React child" and takes
    // the whole canvas down).
    await mount({ properties: { advanced: binding('{{true}}'), schema: binding('{{null}}') } });

    await openMenu();
    expect(menuOptions()).toEqual([]);
    expect(menu().textContent).toContain('No options');

    await mount({
      properties: {
        advanced: binding('{{true}}'),
        schema: binding(`{{[{label: {a: 1}, value: 'x', visible: true, default: false}]}}`),
      },
    });

    await openMenu();
    expect(menuOptions()).toEqual(['[object Object]']);
  });

  test('[TagsInput-SORT-001] Sort tags orders the menu A-Z or Z-A, and `none` keeps the authored order', async () => {
    // Break this catches: passing the wrong sort key through to sortArray, or
    // sorting unconditionally so an authored order can no longer be preserved.
    const options = binding([option('Charlie', 'c'), option('Alpha', 'a'), option('Bravo', 'b')]);

    await mount({ properties: { options, sort: binding('none') } });
    await openMenu();
    expect(menuOptions()).toEqual(['Charlie', 'Alpha', 'Bravo']);

    await mount({ properties: { options, sort: binding('asc') } });
    await openMenu();
    expect(menuOptions()).toEqual(['Alpha', 'Bravo', 'Charlie']);

    await mount({ properties: { options, sort: binding('desc') } });
    await openMenu();
    expect(menuOptions()).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });
});

describe('TagsInput: adding tags', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-TAG-001] selecting an option adds its chip, publishes it, and fires On tag added once', async () => {
    // Break this catches: firing onTagAdded from both onChange and the option's
    // own click path (a double fire), or publishing the label where the value
    // belongs.
    await mount({ events: countingEvent('onTagAdded', 'added') });
    await openMenu();

    await clickOption('Newport');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
    expect(exposed('selectedTags')).toEqual([{ label: 'Newport', value: 'newport' }]);
    expect(fireCount('added')).toBe(1);
  });

  test('[TagsInput-TAG-002] Enter on unmatched text creates a tag, publishes it in `newTagsAdded`, and leaves `tags` alone', async () => {
    // Break this catches: publishing created tags into `tags` (contract D-04),
    // flattening `newTagsAdded` to bare strings (contract D-03), or not firing
    // onTagAdded for a created tag.
    await mount({ events: countingEvent('onTagAdded', 'added') });
    await openMenu();

    await typeText('fresh tag{Enter}');

    await waitFor(() => expect(chips()).toEqual(['fresh tag']));
    expect(exposed('newTagsAdded')).toEqual([{ label: 'fresh tag', value: 'fresh tag' }]);
    expect(exposed('values')).toEqual(['fresh tag']);
    expect(exposed('tags')).toEqual([
      { label: 'Newport', value: 'newport' },
      { label: 'New York', value: 'new_york' },
    ]);
    expect(fireCount('added')).toBe(1);
  });

  test('[TagsInput-TAG-003] with Allow new tags off, unmatched text creates nothing', async () => {
    // Break this catches: dropping the `allowNewTags` guard from either the
    // Enter path or `isValidNewOption`, which lets users invent values a
    // builder deliberately closed down.
    await mount({ properties: { allowNewTags: binding('{{false}}') } });
    await openMenu();

    await typeText('not an option{Enter}');

    expect(chips()).toEqual([]);
    expect(createFooter()).toBeNull();
    expect(exposed('values')).toEqual([]);
  });

  test('[TagsInput-TAG-004] typing an exact existing label selects that option instead of creating a duplicate', async () => {
    // Break this catches: dropping the duplicate check in handleCreate, which
    // would add a second "Newport" whose value is the label, not `newport`.
    await mount();
    await openMenu();

    await typeText('Newport{Enter}');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
    expect(exposed('newTagsAdded')).toEqual([]);
  });

  test('[TagsInput-TAG-005] comma and semicolon commit the typed tag', async () => {
    // Break this catches: removing either delimiter from the key handler, which
    // silently drops the tag a user thought they had committed.
    await mount();
    await openMenu();

    await typeText('red,');
    await waitFor(() => expect(chips()).toEqual(['red']));

    await typeText('blue;');
    await waitFor(() => expect(chips()).toEqual(['red', 'blue']));
    expect(exposed('values')).toEqual(['red', 'blue']);
  });

  test('[TagsInput-TAG-006] pasting a delimited string selects matching tags and creates the rest in one step', async () => {
    // Break this catches: handling only one delimiter in parseDelimitedInput, or
    // creating a duplicate for a part that already matches a configured option.
    await mount({ events: countingEvent('onTagAdded', 'added') });
    await openMenu();
    input().focus();

    await user().paste('newport;brand new');

    await waitFor(() => expect(chips()).toEqual(['Newport', 'brand new']));
    expect(exposed('values')).toEqual(['newport', 'brand new']);
    expect(exposed('newTagsAdded')).toEqual([{ label: 'brand new', value: 'brand new' }]);
    expect(fireCount('added')).toBe(1);
  });

  test('[TagsInput-TAG-007] whitespace-only input creates nothing', async () => {
    // Break this catches: dropping the `trim()` guard in handleCreate, which
    // produces an invisible chip whose value is a space.
    await mount();
    await openMenu();
    input().focus();

    // Pasted, not typed: with the menu open react-select treats a typed space on
    // an empty input as "select the highlighted option", which is its own
    // behaviour and not the guard under test.
    await user().paste('   ');
    await user().keyboard('{Enter}');

    expect(chips()).toEqual([]);
    expect(exposed('values')).toEqual([]);
    expect(exposed('newTagsAdded')).toEqual([]);
  });

  test('[TagsInput-TAG-008] a label differing only in case from an existing option is created as a new tag', async () => {
    // Break this catches: making the create-time duplicate check
    // case-insensitive, which would silently reselect `Newport` when a user
    // deliberately typed `NEWPORT` (contract D-09).
    await mount();
    await openMenu();

    await typeText('NEWPORT{Enter}');

    await waitFor(() => expect(chips()).toEqual(['NEWPORT']));
    expect(exposed('values')).toEqual(['NEWPORT']);
    expect(exposed('newTagsAdded')).toEqual([{ label: 'NEWPORT', value: 'NEWPORT' }]);
  });
});

describe('TagsInput: removing tags', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-DEL-001] removing a chip drops it from the selection and fires On tag deleted once', async () => {
    // Break this catches: firing onTagAdded for a removal (the handler branches
    // on react-select's action name), or firing the delete event twice.
    await mount({
      properties: { values: binding(['newport', 'new_york']) },
      events: countingEvent('onTagDeleted', 'deleted'),
    });
    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));

    await user().click(chipNodes()[0].querySelector('.tags-input-chip-remove'));

    await waitFor(() => expect(chips()).toEqual(['New York']));
    expect(exposed('values')).toEqual(['new_york']);
    expect(fireCount('deleted')).toBe(1);
  });

  test('[TagsInput-DEL-002] Backspace on an empty input removes the last selected tag', async () => {
    // Break this catches: swallowing Backspace in the widget's own key handler
    // instead of letting react-select pop the last value.
    await mount({ properties: { values: binding(['newport', 'new_york']) } });
    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));
    input().focus();

    await user().keyboard('{Backspace}');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });
});

describe('TagsInput: keyboard', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-KEY-001] the first ArrowDown opens the menu, the next moves the highlight, and Enter selects it', async () => {
    // Break this catches: letting the first ArrowDown both open the menu AND
    // move the highlight, so Enter lands on the second option instead of the
    // first.
    await mount();
    input().focus();

    await user().keyboard('{ArrowDown}');
    await waitFor(() => expect(menu()).toBeInTheDocument());

    await user().keyboard('{ArrowDown}{Enter}');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });

  test('[TagsInput-KEY-002] Escape closes the menu and discards the typed text', async () => {
    // Break this catches: closing the menu without clearing the input, which
    // leaves the next open filtered by text the user already dismissed.
    await mount();
    await openMenu();
    await typeText('New');

    await user().keyboard('{Escape}');

    await waitFor(() => expect(menu()).toBeNull());
    expect(input()).toHaveValue('');
    expect(chips()).toEqual([]);
  });

  test('[TagsInput-KEY-003] Tab with typed text commits the tag', async () => {
    // Break this catches: removing the Tab branch, so a user who tabs to the
    // next field loses the tag they just typed.
    await mount();
    await openMenu();

    await typeText('Newport');
    await user().keyboard('{Tab}');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });
});

describe('TagsInput: search', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-SRCH-001] client-side search filters the menu by the typed text and hides selected tags', async () => {
    // Break this catches: dropping either half of the filter — the text match,
    // or the exclusion of tags already selected.
    await mount({ properties: { values: binding(['new_york']) } });
    await openMenu();

    expect(menuOptions()).toEqual(['Newport']);

    await typeText('zz');
    await waitFor(() => expect(menuOptions()).toEqual([]));
  });

  test('[TagsInput-SRCH-002] Server side search stops client filtering and leaves the bound list intact', async () => {
    // Break this catches: keeping the client-side text filter on in server-side
    // mode, which hides rows the query deliberately returned.
    await mount({ properties: { serverSideSearch: binding('{{true}}') } });
    await openMenu();

    await typeText('zzz');

    await waitFor(() => expect(menuOptions()).toEqual(['Newport', 'New York']));
  });

  test('[TagsInput-SRCH-003] with search off the menu never opens, and Enter still commits a tag', async () => {
    // Break this catches: opening the menu when search is off, or losing the
    // separate `!enableSearch` commit path so typing stops producing tags.
    await mount({ properties: { enableSearch: binding('{{false}}') } });

    await user().click(field());
    expect(menu()).toBeNull();

    input().focus();
    await user().keyboard('{ArrowDown}');
    expect(menu()).toBeNull();

    await typeText('Newport{Enter}');

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });
});

describe('TagsInput: option list changes', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-OPT-001] rebinding the option list keeps only the selections that still exist', async () => {
    // Break this catches: leaving the selection untouched when the options
    // change, so `values` keeps publishing a tag the list no longer offers.
    await mount({ properties: { values: binding(['newport', 'new_york']) } });
    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'options', [option('Newport', 'newport')], 'properties');
    });

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });

  test('[TagsInput-OPT-002] Tags loading state shows the menu loader in dynamic mode only', async () => {
    // Break this catches: dropping the `&& advanced` gate (a static list would
    // show a loader that can never resolve) or dropping the loading branch
    // altogether (contract D-07).
    await mount({
      properties: {
        advanced: binding('{{true}}'),
        schema: binding(SCHEMA_THREE),
        optionsLoadingState: binding('{{true}}'),
      },
    });
    await openMenu();

    expect(menuOptions()).toEqual([]);
    expect(menu().querySelector('.loader, .tj-loader, svg')).toBeTruthy();

    await mount({ properties: { optionsLoadingState: binding('{{true}}') } });
    await openMenu();

    expect(menuOptions()).toEqual(['Newport', 'New York']);
  });
});

describe('TagsInput: chip colors', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-CHIP-001] Auto pick chip color overrides the configured chip and text colors', async () => {
    // Break this catches: reading the configured colors while auto colors are
    // on, or ignoring them when the builder turned auto colors off.
    await mount({
      properties: { values: binding(['newport']) },
      styles: {
        autoPickChipColor: binding('{{false}}'),
        tagBackgroundColor: binding('rgb(1, 2, 3)'),
        selectedTextColor: binding('rgb(4, 5, 6)'),
      },
    });
    await waitFor(() => expect(chipNodes()).toHaveLength(1));

    expect(chipNodes()[0].style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(chipNodes()[0].style.color).toBe('rgb(4, 5, 6)');

    await mount({
      properties: { values: binding(['newport']) },
      styles: {
        autoPickChipColor: binding('{{true}}'),
        tagBackgroundColor: binding('rgb(1, 2, 3)'),
        selectedTextColor: binding('rgb(4, 5, 6)'),
      },
    });
    await waitFor(() => expect(chipNodes()).toHaveLength(1));

    expect(chipNodes()[0].style.backgroundColor).not.toBe('rgb(1, 2, 3)');
    expect(chipNodes()[0].style.color).not.toBe('rgb(4, 5, 6)');
  });
});

describe('TagsInput: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-ACT-001] `selectTags` selects tags by value', async () => {
    // Break this catches: matching only on label, which silently selects
    // nothing for the documented value-array format.
    await mount();

    await widget.act('selectTags', ['newport', 'new_york']);

    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));
    expect(exposed('values')).toEqual(['newport', 'new_york']);
  });

  test('[TagsInput-ACT-002] `selectTags` falls back to matching by label', async () => {
    // Break this catches: dropping the label fallback documented as the
    // matching priority, so `selectTags(['Newport'])` becomes a no-op.
    await mount();

    await widget.act('selectTags', ['New York']);

    await waitFor(() => expect(chips()).toEqual(['New York']));
    expect(exposed('values')).toEqual(['new_york']);
  });

  test('[TagsInput-ACT-003] `selectTags` accepts object and mixed formats', async () => {
    // Break this catches: dropping the object-unwrapping branch, which turns
    // `[{value: 'newport'}]` into a match against "[object Object]".
    await mount();

    await widget.act('selectTags', [{ value: 'newport' }, { label: 'New York' }]);

    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));
    expect(exposed('values')).toEqual(['newport', 'new_york']);
  });

  test('[TagsInput-ACT-004] `selectTags` ignores unknown tags and tags already selected', async () => {
    // Break this catches: pushing an unmatched tag as a bare string (an empty
    // chip) or re-adding a tag that is already selected.
    await mount({ properties: { values: binding(['newport']) } });
    await waitFor(() => expect(chips()).toEqual(['Newport']));

    await widget.act('selectTags', ['newport', 'does_not_exist']);

    expect(chips()).toEqual(['Newport']);
    expect(exposed('values')).toEqual(['newport']);
  });

  test('[TagsInput-ACT-005] `deselectTags` removes tags matched by value or label', async () => {
    // Break this catches: matching only one of the two identifiers, so half the
    // documented input formats silently do nothing.
    await mount({ properties: { values: binding(['newport', 'new_york']) } });
    await waitFor(() => expect(chips()).toEqual(['Newport', 'New York']));

    await widget.act('deselectTags', ['newport']);
    await waitFor(() => expect(chips()).toEqual(['New York']));

    await widget.act('deselectTags', [{ label: 'New York' }]);
    await waitFor(() => expect(chips()).toEqual([]));
    expect(exposed('values')).toEqual([]);
  });

  test('[TagsInput-ACT-006] `clear` empties the selection and keeps created tags selectable', async () => {
    // Break this catches: clearing `newTagsAdded` along with the selection,
    // which would drop a user-created tag out of the menu it was just added to.
    await mount();
    await openMenu();
    await typeText('brand new{Enter}');
    await waitFor(() => expect(chips()).toEqual(['brand new']));

    await widget.act('clear');

    await waitFor(() => expect(chips()).toEqual([]));
    expect(exposed('values')).toEqual([]);
    expect(exposed('selectedTags')).toEqual([]);
    expect(exposed('newTagsAdded')).toEqual([{ label: 'brand new', value: 'brand new' }]);
    await openMenu();
    expect(menuOptions()).toContain('brand new');
  });
});

describe('TagsInput: focus and blur events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-EVT-001] On focus fires when the user clicks into the widget, and not while disabled', async () => {
    // Break this catches: firing onFocus before the disabled/loading guard, so
    // a disabled field still runs the builder's handler.
    await mount({ events: countingEvent('onFocus', 'focused') });

    await user().click(field());
    await waitFor(() => expect(fireCount('focused')).toBe(1));

    await mount({ properties: { disabledState: binding('{{true}}') }, events: countingEvent('onFocus', 'focused') });
    await user().click(field());

    expect(fireCount('focused')).toBe(1);
  });

  test('[TagsInput-EVT-002] On blur fires on an outside click while the menu is open, and not while it is closed', async () => {
    // Break this catches: firing onBlur on every document mousedown regardless
    // of menu state, which would run the handler on unrelated canvas clicks.
    await mount({ events: countingEvent('onBlur', 'blurred') });
    await openMenu();

    rtlFireEvent.mouseDown(document.body);

    await waitFor(() => expect(fireCount('blurred')).toBe(1));
    await waitFor(() => expect(menu()).toBeNull());

    rtlFireEvent.mouseDown(document.body);
    expect(fireCount('blurred')).toBe(1);
  });
});

describe('TagsInput: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-VAL-001] a mandatory field with no tags is invalid until a tag is selected', async () => {
    // Break this catches: passing an empty array instead of null to validate(),
    // which the mandatory rule reads as answered.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isMandatory')).toBe(true));
    expect(exposed('isValid')).toBe(false);

    await openMenu();
    await clickOption('Newport');

    await waitFor(() => expect(exposed('isValid')).toBe(true));
  });

  test('[TagsInput-VAL-002] a custom validation message is shown once the user has interacted', async () => {
    // Break this catches: rendering the error row without its message, or
    // dropping customRule from the validate() call entirely.
    await mount({
      validation: {
        customRule: binding(`{{components.${NAME}.values.length >= 2 ? '' : 'Select at least 2 tags'}}`),
      },
    });
    await openMenu();

    await clickOption('Newport');

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBe('Select at least 2 tags');
  });

  test('[TagsInput-VAL-003] `isValid` is recomputed on every selection change', async () => {
    // Break this catches: exposing isValid once on mount, so an app reading it
    // keeps seeing the load-time verdict.
    await mount({ validation: { mandatory: binding('{{true}}') } });
    await openMenu();

    await clickOption('Newport');
    await waitFor(() => expect(exposed('isValid')).toBe(true));

    await user().click(chipNodes()[0].querySelector('.tags-input-chip-remove'));

    await waitFor(() => expect(exposed('isValid')).toBe(false));
  });

  test('[TagsInput-VAL-004] the validation error stays hidden until the user interacts', async () => {
    // Break this catches: dropping the `userInteracted` gate, which shows a
    // red "cannot be empty" on every freshly opened app.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isValid')).toBe(false));
    expect(errorText()).toBeNull();

    await openMenu();
    await clickOption('Newport');
    await user().click(chipNodes()[0].querySelector('.tags-input-chip-remove'));

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });
});

describe('TagsInput: inside a Form', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-FORM-001] submitting the Form reveals the error on a field the user never touched', async () => {
    // Break this catches: not subscribing to the Form submit signal, so a
    // mandatory field blocks submission without telling the user why.
    widget.renderInsideForm({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(widgetRoot()).toBeInTheDocument());
    expect(errorText()).toBeNull();

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).submitForm();
    });

    await waitFor(() => expect(errorText()).toBe('Field cannot be empty'));
  });

  test('[TagsInput-FORM-002] clearing the Form empties the selection and republishes the exposed values', async () => {
    // Break this catches: not subscribing to the Form clear signal, so a
    // "clear" leaves stale tags in `values` for the next submission.
    widget.renderInsideForm({ properties: { values: binding(['newport']) } });
    await waitFor(() => expect(chips()).toEqual(['Newport']));

    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(chips()).toEqual([]));
    expect(exposed('values')).toEqual([]);
    expect(exposed('selectedTags')).toEqual([]);
  });
});

describe('TagsInput: disabled, loading and visibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-STATE-001] Disable makes the field non-interactive and publishes `isDisabled`', async () => {
    // Break this catches: publishing the disabled state without applying it (or
    // the reverse), which lets a user edit a field an app believes is locked.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isDisabled')).toBe(true));
    expect(input()).toBeDisabled();
  });

  test('[TagsInput-STATE-002] Loading state shows the loader and publishes `isLoading`', async () => {
    // Break this catches: dropping the isLoading prop on the select, so the
    // widget looks idle while its options are still arriving.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(exposed('isLoading')).toBe(true));
    expect(document.querySelector(`#component-${ID} svg`)).toBeTruthy();
  });

  test('[TagsInput-STATE-003] Visibility off hides the widget and publishes `isVisible`', async () => {
    // Break this catches: publishing isVisible without hiding the node, which
    // leaves a "hidden" field clickable on the canvas.
    await mount({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(widgetRoot().className).toContain('invisible');
  });

  test('[TagsInput-STATE-004] `setDisable` survives an unrelated re-resolve and a no-op rewrite of `disabledState`', async () => {
    // Break this catches: widening the re-sync effect's dependencies (or
    // dropping its equality check), so any property re-resolve silently reverts
    // a RunJS-set disable.
    await mount();

    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed('isDisabled')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'disabledState', '{{false}}', 'properties');
    });

    expect(exposed('isDisabled')).toBe(true);
    expect(input()).toBeDisabled();
  });

  test('[TagsInput-STATE-005] `setVisibility` survives an unrelated re-resolve and a no-op rewrite of `visibility`', async () => {
    // Break this catches: the same re-sync effect reverting a RunJS-set
    // visibility when an unrelated property changes.
    await mount();

    await widget.act('setVisibility', false);
    await waitFor(() => expect(exposed('isVisible')).toBe(false));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
    });

    expect(exposed('isVisible')).toBe(false);
    expect(widgetRoot().className).toContain('invisible');
  });

  test('[TagsInput-STATE-006] `setLoading` survives an unrelated re-resolve and a no-op rewrite of `loadingState`', async () => {
    // Break this catches: the same re-sync effect reverting a RunJS-set loading
    // state, so a spinner disappears mid-query.
    await mount();

    await widget.act('setLoading', true);
    await waitFor(() => expect(exposed('isLoading')).toBe(true));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'label', 'Renamed', 'properties');
      widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    });

    expect(exposed('isLoading')).toBe(true);
  });

  test('[TagsInput-STATE-007] a disabled or loading widget does not open its menu on click', async () => {
    // Break this catches: dropping the guard at the top of the click handler, so
    // a loading field opens a menu listing stale options.
    await mount({ properties: { disabledState: binding('{{true}}') } });
    await user().click(field());
    expect(menu()).toBeNull();

    await mount({ properties: { loadingState: binding('{{true}}') } });
    await user().click(field());
    expect(menu()).toBeNull();
  });
});

/**
 * A definition saved before `enableSearch`/`serverSideSearch`/`sort`/
 * `dynamicHeight` existed: those keys are ABSENT, not falsy. Seeding them as
 * `undefined` would not be the same app — the resolver would still see the
 * keys.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'TagsInput',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Tags'),
    advanced: binding('{{false}}'),
    allowNewTags: binding('{{true}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    values: binding([]),
    options: binding([option('Newport', 'newport'), option('New York', 'new_york')]),
  },
});

describe('TagsInput: accessibility and compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[TagsInput-A11Y-001] the field carries its required, invalid and label semantics', async () => {
    // Break this catches: dropping aria-invalid/aria-labelledby from the select,
    // which leaves a screen-reader user with an unnamed field that never
    // announces its error.
    await mount({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'true'));
    expect(input()).toHaveAttribute('aria-labelledby', `${ID}-label`);

    await openMenu();
    await clickOption('Newport');

    await waitFor(() => expect(input()).toHaveAttribute('aria-invalid', 'false'));
  });

  test('[TagsInput-COMPAT-001] a definition predating the search and sort settings still renders and filters', async () => {
    legacyWidget.setup();
    // Break this catches: making `enableSearch` default to falsy when the key is
    // absent, which turns every app saved before the setting existed into a
    // menu-less input.
    legacyWidget.render();
    await waitFor(() => expect(widgetRoot()).toBeInTheDocument());

    await openMenu();
    expect(menuOptions()).toEqual(['Newport', 'New York']);

    await legacyWidget.session.user.type(input(), 'York');

    await waitFor(() => expect(menuOptions()).toEqual(['New York']));
    legacyWidget.teardown();
  });
});

describe('TagsInput: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-05): the defaults effect is keyed on
  // JSON.stringify(schema), so ANY re-resolve of a bound schema re-applies the
  // schema defaults over whatever the user had selected. The documented
  // server-side-search workflow rebinds that schema on every keystroke, so the
  // user's tags are wiped mid-search. Fix: apply defaults on the first resolve
  // and on an advanced-mode switch only, and reconcile (rather than replace)
  // the selection when the option list changes.
  test.failing('[TagsInput-BUG-001] a schema re-resolve keeps the tags the user selected', async () => {
    await mount({ properties: { advanced: binding('{{true}}'), schema: binding(SCHEMA_THREE) } });
    await openMenu();
    await clickOption('Gamma');
    await waitFor(() => expect(chips()).toEqual(['Alpha', 'Gamma']));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(
        ID,
        'schema',
        `{{[
            {label: 'Alpha', value: 'a', visible: true, default: true, disable: false},
            {label: 'Gamma', value: 'g', visible: true, default: false, disable: false},
            {label: 'Delta', value: 'd', visible: true, default: false, disable: false}
          ]}}`,
        'properties'
      );
    });

    expect(chips()).toEqual(['Alpha', 'Gamma']);
  });

  // BUG (unfixed, contract D-10): the mount effect publishes `isValid` from the
  // first render's closure, computed against an EMPTY selection, and it lands
  // after the defaults effect's correct write. A mandatory field that loads
  // already filled therefore publishes `isValid: false` until the user touches
  // it, so a submit button bound to `{{components.tagsinput1.isValid}}` starts
  // disabled on a valid form. Fix: compute the status from the default selection
  // in that effect, or leave `isValid` to the defaults effect alone.
  test.failing(
    '[TagsInput-BUG-003] a mandatory field that loads with tags already selected publishes isValid true',
    async () => {
      await mount({
        properties: { values: binding(['newport']) },
        validation: { mandatory: binding('{{true}}') },
      });
      await waitFor(() => expect(chips()).toEqual(['Newport']));

      // The rendered field already agrees it is valid.
      expect(input()).toHaveAttribute('aria-invalid', 'false');
      expect(exposed('isValid')).toBe(true);
    }
  );

  // BUG (unfixed, contract D-06): selectTags tests membership against the
  // pre-call `selected` rather than the array it is building, so a repeated tag
  // in one call is pushed twice. Fix: test against `newSelected`.
  test.failing('[TagsInput-BUG-002] `selectTags` passing the same tag twice selects it once', async () => {
    await mount();

    await widget.act('selectTags', ['newport', 'newport']);

    await waitFor(() => expect(chips()).toEqual(['Newport']));
    expect(exposed('values')).toEqual(['newport']);
  });
});
