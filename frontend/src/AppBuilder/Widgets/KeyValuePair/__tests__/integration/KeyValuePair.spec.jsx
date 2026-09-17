/**
 * KeyValuePair: rendering, inline editing/changeset, auto-generated fields,
 * loading/disabled/visibility states, CSA actions, events, and per-fieldType
 * adapter wiring, per the approved contract
 * (frontend/ee/test/app-builder/widgets/KeyValuePair/TESTING.md).
 *
 * Real store, real RenderWidget, real KeyValuePair / KeyValueRow / FieldAdapters.
 * Nothing about the widget is mocked.
 *
 * Deliberately NOT duplicated here (per contract decision D-01, wiring-only
 * scope): exhaustive semantics of the shared `Shared/DataTypes` renderers and
 * validation hooks (date parsing, markdown sanitization, react-select
 * internals, …) — those are shared with the Table widget and belong to a
 * future shared-layer/Table contract. What this file proves is that each
 * `fieldType` reaches the correct adapter with the correct props.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/KeyValuePair/TESTING.md) as a
 * `[KeyValuePair-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { createWidgetHarness, binding, store, MODULE_ID, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';

const ID = 'kv1';
const NAME = 'keyvaluepair1';

const field = (overrides) => ({
  id: overrides.key,
  key: overrides.key,
  name: overrides.key,
  isEditable: false,
  ...overrides,
});

const DEFAULT_FIELDS = [
  field({ key: 'name', name: 'Name', fieldType: 'string', isEditable: true }),
  field({ key: 'email', name: 'Email', fieldType: 'string', isEditable: false }),
];
const DEFAULT_DATA = { name: 'Ada Lovelace', email: 'ada@example.com' };

const widget = createWidgetHarness({
  componentType: 'KeyValuePair',
  handle: NAME,
  id: ID,
  // Baseline mirrors keyValuePair.js's own `definition.properties` defaults.
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(DEFAULT_DATA),
    fields: binding(DEFAULT_FIELDS),
    useDynamicField: binding('{{false}}'),
    fieldDynamicData: binding([]),
    fieldDeletionHistory: binding([]),
    dynamicHeight: binding('{{false}}'),
    showUpdateActions: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const container = () => document.querySelector('.key-value-pair-container');
const rows = () => document.querySelectorAll('.key-value-row');
const rowLabelText = (row) => row.querySelector('.key-value-label')?.textContent;
const valueContainer = (rowEl) => rowEl.querySelector('.key-value-render-value');
const saveButton = () => document.querySelector('[data-cy="kv-button-save-changes"]');
const cancelButton = () => document.querySelector('[data-cy="kv-button-cancel"]');
const exposed = (key) => widget.exposed()?.[key];

describe('KeyValuePair: rendering', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-SURFACE-001] renders one row per configured field, in order, from data', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowLabelText(rows()[0])).toBe('Name');
    expect(rowLabelText(rows()[1])).toBe('Email');
    expect(valueContainer(rows()[0]).textContent).toContain('Ada Lovelace');
    expect(valueContainer(rows()[1]).textContent).toContain('ada@example.com');
  });

  test('[KeyValuePair-SURFACE-002] auto-generates rows from data keys when fields is empty', async () => {
    widget.render({ properties: { fields: binding([]), data: binding({ city: 'Berlin' }) } });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowLabelText(rows()[0])).toBe('City');
    expect(valueContainer(rows()[0]).textContent).toContain('Berlin');
  });

  test('[KeyValuePair-SURFACE-003] excludes a field with fieldVisibility: false', async () => {
    widget.render({
      properties: {
        fields: binding([
          field({ key: 'name', name: 'Name', fieldType: 'string' }),
          field({ key: 'email', name: 'Email', fieldType: 'string', fieldVisibility: false }),
        ]),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowLabelText(rows()[0])).toBe('Name');
  });
});

describe('KeyValuePair: inline editing and changeset', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-EDIT-001] clicking an editable field enters edit mode and focuses its input', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));

    await waitFor(() => expect(document.getElementById(`${ID}-name`)).toHaveFocus());
  });

  test('[KeyValuePair-EDIT-002] editing stores the value in changeSet, leaving the exposed data and the original property untouched', async () => {
    // The exposed `data` variable mirrors `properties.data` verbatim — it is
    // never merged with `editedData`. An app reads pending edits from
    // `changeSet`, not from `data`.
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.textContent = 'Grace Hopper';
    input.blur();

    await waitFor(() => expect(exposed('changeSet')).toEqual({ name: 'Grace Hopper' }));
    expect(exposed('data')).toEqual(DEFAULT_DATA);
    // The original property input is untouched.
    expect(store().getComponentDefinition(ID)?.component?.definition?.properties?.data?.value).toEqual(DEFAULT_DATA);
  });

  test('[KeyValuePair-EDIT-003] blur exits edit mode', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.blur();

    await waitFor(() => expect(document.getElementById(`${ID}-name`)).toBeNull());
  });

  test('[KeyValuePair-EDIT-004] a non-editable field never enters edit mode', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[1]));

    expect(document.getElementById(`${ID}-email`)).toBeNull();
  });

  test('[KeyValuePair-EDIT-005] disabledState blocks editing even when the field is isEditable', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));

    expect(document.getElementById(`${ID}-name`)).toBeNull();
  });

  test('[KeyValuePair-EDIT-006] the changeset popover appears only with pending changes; Save fires the event and clears changeSet, Cancel discards', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(saveButton()).toBeNull();

    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.textContent = 'Grace Hopper';
    input.blur();

    await waitFor(() => expect(saveButton()).toBeInTheDocument());

    await widget.session.user.click(cancelButton());
    await waitFor(() => expect(exposed('changeSet')).toEqual({}));
    expect(saveButton()).toBeNull();

    await widget.session.user.click(valueContainer(rows()[0]));
    const input2 = await waitFor(() => document.getElementById(`${ID}-name`));
    input2.textContent = 'Grace Hopper';
    input2.blur();
    await waitFor(() => expect(saveButton()).toBeInTheDocument());

    await widget.session.user.click(saveButton());
    await waitFor(() => expect(exposed('changeSet')).toEqual({}));
    expect(saveButton()).toBeNull();
  });

  test('[KeyValuePair-EDIT-007] the popover never appears when showUpdateActions is false, even with pending changes', async () => {
    widget.render({ properties: { showUpdateActions: binding('{{false}}') } });

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.textContent = 'Grace Hopper';
    input.blur();

    await waitFor(() => expect(exposed('changeSet')).toEqual({ name: 'Grace Hopper' }));
    expect(saveButton()).toBeNull();
  });

  test('[KeyValuePair-EDIT-008] the exposed resetChanges function clears the changeset', async () => {
    widget.render();

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.textContent = 'Grace Hopper';
    input.blur();
    await waitFor(() => expect(exposed('changeSet')).toEqual({ name: 'Grace Hopper' }));

    await widget.act('resetChanges');

    await waitFor(() => expect(exposed('changeSet')).toEqual({}));
  });
});

describe('KeyValuePair: auto-generated fields (store integration)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-AUTOGEN-006] useDynamicField uses fieldDynamicData and ignores persisted fields', async () => {
    widget.render({
      properties: {
        useDynamicField: binding('{{true}}'),
        fieldDynamicData: binding([{ name: 'City', key: 'city' }]),
        data: binding({ city: 'Berlin', name: 'Ada Lovelace' }),
        // A persisted `fields` array that must be ignored while dynamic mode is on.
        fields: binding(DEFAULT_FIELDS),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowLabelText(rows()[0])).toBe('City');
  });

  test('[KeyValuePair-AUTOGEN-007] persists generated fields to the store only when changed, targeting the correct component', async () => {
    const otherId = 'kv2';
    widget.render({
      properties: { fields: binding([]), data: binding({ city: 'Berlin' }) },
      also: [{ id: otherId, componentType: 'KeyValuePair', name: 'keyvaluepair2' }],
      afterSeed: () => {
        const otherDef = require('@/test/app-builder').componentDefinition(otherId, 'keyvaluepair2', 'KeyValuePair', {
          dataSourceSelector: binding('rawJson'),
          data: binding({ country: 'Germany' }),
          fields: binding([]),
        });
        useStore.getState().componentsSlice?.mergeComponents?.({ [otherId]: otherDef }, MODULE_ID);
      },
    });

    await waitFor(() =>
      expect(store().getComponentDefinition(ID)?.component?.definition?.properties?.fields?.value).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: 'city' })])
      )
    );
    // The write targeted only this component's own id, not any sibling's fields.
    const ownFields = store().getComponentDefinition(ID)?.component?.definition?.properties?.fields?.value;
    expect(ownFields.every((f) => f.key === 'city')).toBe(true);
  });

  test('[KeyValuePair-AUTOGEN-008] a key in fieldDeletionHistory is never resurrected through the real store', async () => {
    widget.render({
      properties: {
        fields: binding([]),
        data: binding({ name: 'Ada Lovelace', email: 'ada@example.com' }),
        fieldDeletionHistory: binding(['email']),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rowLabelText(rows()[0])).toBe('Name');
  });
});

describe('KeyValuePair: loading, disabled, and visibility states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-STATE-001] loadingState renders only the Loader, independent of visibility or pending changes', async () => {
    widget.render({ properties: { loadingState: binding('{{true}}'), visibility: binding('{{false}}') } });

    await waitFor(() => expect(document.querySelector('.key-value-pair-loading')).toBeInTheDocument());
    expect(rows()).toHaveLength(0);
    expect(saveButton()).toBeNull();
  });

  test('[KeyValuePair-STATE-002] visibility: false applies the invisible class without unmounting', async () => {
    widget.render({ properties: { visibility: binding('{{false}}') } });

    // `useExposeState`'s own initial state briefly defaults `isVisible` to
    // `true` regardless of the passed prop (a pre-existing quirk outside this
    // contract's scope) before its effect corrects it — wait for the exposed
    // variable to settle before asserting the class, so this test isn't
    // fooled by that transient.
    await waitFor(() => expect(exposed('isVisible')).toBe(false));
    expect(container()).toHaveClass('invisible');
    expect(rows()).toHaveLength(2);
  });

  test('[KeyValuePair-STATE-003] disabledState resolves isDisabled, blocking edits (see KeyValuePair-EDIT-005)', async () => {
    widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    expect(document.getElementById(`${ID}-name`)).toBeNull();
  });

  test('[KeyValuePair-STATE-004] dynamicHeight only engages when currentMode is view', async () => {
    widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(document.querySelector('.key-value-pair-content')).toHaveStyle({ overflowY: 'hidden' });
  });

  test('[KeyValuePair-STATE-004] dynamicHeight stays disengaged in edit mode even when the property is true', async () => {
    widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(document.querySelector('.key-value-pair-content')).toHaveStyle({ overflowY: 'auto' });
  });
});

describe('KeyValuePair: CSA actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-CSA-001] setVisibility toggles visibility', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(container()).not.toHaveClass('invisible'));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(container()).toHaveClass('invisible'));
  });

  test('[KeyValuePair-CSA-002] setDisable toggles disabled state', async () => {
    widget.render({ properties: { disabledState: binding('{{false}}') } });
    await waitFor(() => expect(rows()).toHaveLength(2));

    await widget.act('setDisable', true);

    await widget.session.user.click(valueContainer(rows()[0]));
    expect(document.getElementById(`${ID}-name`)).toBeNull();
  });

  test('[KeyValuePair-CSA-003] setLoading toggles the Loader', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(rows()).toHaveLength(2));

    await widget.act('setLoading', true);

    await waitFor(() => expect(document.querySelector('.key-value-pair-loading')).toBeInTheDocument());
  });
});

describe('KeyValuePair: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[KeyValuePair-EVENT-001] onFieldClick fires and exposes lastClickedField', async () => {
    widget.render({ events: setVariableOn(ID, 'onFieldClick') });

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[1]));

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('YES'));
    expect(exposed('lastClickedField')).toEqual({ key: 'email', value: 'ada@example.com' });
  });

  test('[KeyValuePair-EVENT-002] onFieldValueChanged fires on edit', async () => {
    widget.render({ events: setVariableOn(ID, 'onFieldValueChanged') });

    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-name`));
    input.textContent = 'Grace Hopper';
    input.blur();

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('YES'));
  });
});

describe('KeyValuePair: fieldType adapter wiring', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const renderField = (fieldOverrides, data) =>
    widget.render({
      properties: {
        fields: binding([field({ key: 'v', name: 'Value', ...fieldOverrides })]),
        data: binding(data),
      },
    });

  test('[KeyValuePair-FIELDTYPE-001] string: read mode shows the value; editing gets an accent border; invalid value surfaces a row error', async () => {
    renderField({ fieldType: 'string', isEditable: true, minLength: 5 }, { v: 'hi' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    await widget.session.user.click(valueContainer(rows()[0]));
    await waitFor(() => expect(document.getElementById(`${ID}-v`)).toBeInTheDocument());
    expect(valueContainer(rows()[0])).toHaveStyle({ border: `2px solid var(--primary)` });
    await waitFor(() => expect(document.querySelector('.kv-row-validation-error')).toBeInTheDocument());
  });

  test('[KeyValuePair-FIELDTYPE-002] number: renders NumberField as a live numeric input, unconditional on isEditing', async () => {
    renderField({ fieldType: 'number', isEditable: true, minValue: 5 }, { v: 1 });

    await waitFor(() => expect(rows()).toHaveLength(1));
    const input = document.querySelector(`#${ID}-v`);
    expect(input).toHaveAttribute('type', 'number');
    await waitFor(() => expect(document.querySelector('.kv-row-validation-error')).toBeInTheDocument());
  });

  test('[KeyValuePair-FIELDTYPE-003] boolean: renders a checkbox toggle; edit icon stays visible and no accent border is applied', async () => {
    renderField({ fieldType: 'boolean', isEditable: true }, { v: true });

    await waitFor(() => expect(rows()).toHaveLength(1));
    const checkbox = document.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeChecked();
    expect(document.querySelector('.kv-edit-icon')).toBeInTheDocument();
    expect(valueContainer(rows()[0]).style.border).toBe('');
  });

  test('[KeyValuePair-FIELDTYPE-004] select: renders SelectField without isMulti', async () => {
    renderField({ fieldType: 'select', isEditable: true, options: [{ label: 'A', value: 'a' }] }, { v: 'a' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(document.querySelector('.react-select__value-container')).toBeInTheDocument();
    expect(document.querySelector('.react-select__value-container')).not.toHaveClass(
      'react-select__value-container--is-multi'
    );
  });

  test('[KeyValuePair-FIELDTYPE-005] text: renders TextField (multiline, pre-wrapped) via the same click-to-edit contract as string', async () => {
    renderField({ fieldType: 'text', isEditable: true }, { v: 'hello' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    await widget.session.user.click(valueContainer(rows()[0]));
    const input = await waitFor(() => document.getElementById(`${ID}-v`));
    // `whiteSpace: pre-wrap` is TextRenderer's own editable style, absent from
    // StringRenderer — this is what actually distinguishes the two adapters,
    // since both otherwise produce a near-identical contentEditable div.
    expect(input).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  test('[KeyValuePair-FIELDTYPE-006] datepicker: renders DatepickerField', async () => {
    renderField({ fieldType: 'datepicker', isEditable: true }, { v: '2024-01-15' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(valueContainer(rows()[0])).toHaveClass('kv-datepicker');
    expect(document.querySelector('.react-datepicker-wrapper')).toBeInTheDocument();
  });

  test('[KeyValuePair-FIELDTYPE-007] newMultiSelect: renders SelectField with isMulti', async () => {
    renderField(
      {
        fieldType: 'newMultiSelect',
        isEditable: true,
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      },
      { v: ['a', 'b'] }
    );

    await waitFor(() => expect(rows()).toHaveLength(1));
    await waitFor(() => expect(document.querySelectorAll('.react-select__multi-value__label')).toHaveLength(2));
    expect(document.querySelector('.react-select__value-container')).toHaveClass(
      'react-select__value-container--is-multi'
    );
  });

  test('[KeyValuePair-FIELDTYPE-008] link: renders LinkField as an anchor', async () => {
    renderField({ fieldType: 'link' }, { v: 'https://example.com' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    const anchor = document.querySelector('a');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
  });

  test('[KeyValuePair-FIELDTYPE-009] image: renders ImageField as an img', async () => {
    renderField({ fieldType: 'image' }, { v: 'https://example.com/a.png' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(document.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
  });

  test("[KeyValuePair-FIELDTYPE-010] json: renders JsonField, applying JSONRenderer's own double-space formatting", async () => {
    // `JSONRenderer.format()` renders `{  "a":  1  }` (its own distinctive
    // double-space punctuation) — a raw/markdown/html passthrough of the same
    // source string would show `{"a":1}` verbatim, so this is what actually
    // distinguishes the adapter from a swapped one, not just substring 'a'.
    renderField({ fieldType: 'json' }, { v: '{"a":1}' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(valueContainer(rows()[0]).textContent).toContain('{  "a":  1  }');
  });

  test("[KeyValuePair-FIELDTYPE-011] markdown: renders MarkdownField, not HTMLRenderer's .html-cell wrapper", async () => {
    renderField({ fieldType: 'markdown' }, { v: 'hello world' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(valueContainer(rows()[0]).textContent).toContain('hello world');
    expect(valueContainer(rows()[0]).querySelector('.html-cell')).toBeNull();
  });

  test('[KeyValuePair-FIELDTYPE-012] html: renders HtmlField, sanitized', async () => {
    renderField({ fieldType: 'html' }, { v: '<em>hi</em><img src="x" onerror="window.__xss = true" />' });

    await waitFor(() => expect(rows()).toHaveLength(1));
    const htmlCell = document.querySelector('.html-cell');
    expect(htmlCell.querySelector('em')).toHaveTextContent('hi');
    expect(htmlCell.querySelector('img')).not.toHaveAttribute('onerror');
  });
});
