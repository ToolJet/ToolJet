/**
 * UI 2.0 Tags input: free-typed tags as chips, with suggestions.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Tags input itself does. Titles carry [ShadTagsInput-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tags1';
const widget = createWidgetHarness({
  componentType: 'ShadTagsInput',
  handle: 'tagsinput1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Tags'),
    placeholder: binding('Add a tag...'),
    defaultValue: binding("{{['react', 'typescript']}}"),
    suggestions: binding("{{['react', 'typescript', 'node', 'python', 'design', 'devops']}}"),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const input = () => screen.getByPlaceholderText('Add a tag...');
const exposed = () => widget.exposed() ?? {};
const type = async (text) => {
  await act(async () => fireEvent.change(input(), { target: { value: text } }));
};
const press = async (key) => {
  await act(async () => fireEvent.keyDown(input(), { key }));
};
const chips = () =>
  screen.queryAllByRole('button', { name: /^Remove / }).map((b) => b.getAttribute('aria-label').slice(7));

describe('UI 2.0 Tags input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTagsInput-DEF-001] shows the label, help text, placeholder and the defaultValue tags, and exposes them', async () => {
    render({ properties: { description: binding('Press Enter or comma to add') } });

    expect(await screen.findByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Press Enter or comma to add')).toBeInTheDocument();
    expect(input()).toBeInTheDocument();
    expect(chips()).toEqual(['react', 'typescript']);
    await waitFor(() => expect(exposed().values).toEqual(['react', 'typescript']));
    expect(exposed().newTagsAdded).toEqual([]);
    expect(exposed().label).toBe('Tags');
  });

  test('[ShadTagsInput-EVT-001] Enter adds the typed tag, firing onTagAdded and onChange with the new state exposed', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onTagAdded', { key: 'added', value: '{{components.tagsinput1.lastAddedTag}}' }),
      ...setVariableOn(ID, 'onChange', { key: 'changed', value: '{{components.tagsinput1.values}}' }),
    ]);

    await type('vue');
    await press('Enter');

    await waitFor(() => expect(widget.variables().added).toBe('vue'));
    expect(widget.variables().changed).toEqual(['react', 'typescript', 'vue']);
    // A tag that is not among the suggestions is a new one.
    expect(exposed().newTagsAdded).toEqual(['vue']);
  });

  test('[ShadTagsInput-PROP-001] a comma adds each typed tag at once', async () => {
    render();

    await type('go,rust,');

    await waitFor(() => expect(exposed().values).toEqual(['react', 'typescript', 'go', 'rust']));
    expect(input()).toHaveValue('');
  });

  test('[ShadTagsInput-VAL-001] a duplicate is refused with a message, ignoring case unless caseSensitive is on', async () => {
    render();
    await type('React');
    await press('Enter');
    expect(await screen.findByRole('alert')).toHaveTextContent('"React" is already added');
    expect(exposed().values).toHaveLength(2);

    render({ properties: { caseSensitive: binding('{{true}}') } });
    await type('React,');
    await waitFor(() => expect(exposed().values).toEqual(['react', 'typescript', 'React']));
  });

  test('[ShadTagsInput-EVT-002] Backspace in an empty box and a chip remove button delete tags and fire onTagDeleted', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onTagDeleted', { key: 'removed', value: '{{components.tagsinput1.lastRemovedTag}}' }),
      ...countInvocationsOn(ID, 'onChange'),
    ]);

    await press('Backspace');
    await waitFor(() => expect(widget.variables().removed).toBe('typescript'));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove react' })));
    await waitFor(() => expect(widget.variables().removed).toBe('react'));
    expect(exposed().values).toEqual([]);
    expect(widget.variables().calls).toBe(2);
  });

  test('[ShadTagsInput-PROP-002] suggestions matching the typed text are offered, and a click adds one', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') } });

    await act(async () => input().focus());
    await type('pyt');
    await act(async () => fireEvent.click(screen.getByRole('option', { name: 'python' })));

    await waitFor(() => expect(exposed().values).toEqual(['python']));
    expect(exposed().newTagsAdded).toEqual([]);
  });

  test('[ShadTagsInput-KBD-001] arrow keys move through the suggestions and Enter adds the highlighted one', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') } });

    await act(async () => input().focus());
    await type('de'); // node, design, devops
    await press('ArrowDown');
    expect(screen.getByRole('option', { name: 'node' })).toHaveAttribute('aria-selected', 'true');
    await press('ArrowDown');
    expect(screen.getByRole('option', { name: 'design' })).toHaveAttribute('aria-selected', 'true');
    await press('Enter');

    await waitFor(() => expect(exposed().values).toEqual(['design']));
  });

  test('[ShadTagsInput-PROP-003] allowCustomTags off refuses a tag that is not a suggestion', async () => {
    render({ properties: { allowCustomTags: binding('{{false}}') } });

    await type('custom,');

    expect(await screen.findByRole('alert')).toHaveTextContent('Pick a tag from the suggestions');
    expect(exposed().values).toEqual(['react', 'typescript']);
  });

  test('[ShadTagsInput-VAL-002] tagPattern refuses a tag that does not match, with the patternError message', async () => {
    render({ properties: { tagPattern: binding('^[a-z]+$'), patternError: binding('Lowercase letters only') } });

    await type('Bad1');
    await press('Enter');

    expect(await screen.findByRole('alert')).toHaveTextContent('Lowercase letters only');
    expect(exposed().values).toEqual(['react', 'typescript']);
  });

  test('[ShadTagsInput-VAL-003] maxTags stops new tags past the limit and says why', async () => {
    render({ properties: { maxTags: binding('{{2}}') } });

    await type('node');
    await press('Enter');

    expect(await screen.findByRole('alert')).toHaveTextContent('You can add up to 2 tags');
    expect(exposed().values).toEqual(['react', 'typescript']);
  });

  test('[ShadTagsInput-PROP-004] addOnBlur adds what was typed when the box loses focus', async () => {
    render({ properties: { addOnBlur: binding('{{true}}') } });

    await act(async () => input().focus());
    await type('kotlin');
    await act(async () => input().blur());

    await waitFor(() => expect(exposed().values).toEqual(['react', 'typescript', 'kotlin']));
  });

  test('[ShadTagsInput-PROP-005] showClearBtn adds a button that removes every tag', async () => {
    render();
    expect(screen.queryByRole('button', { name: 'Clear tags' })).toBeNull();

    render({ properties: { showClearBtn: binding('{{true}}') } });
    await act(async () => fireEvent.click(await screen.findByRole('button', { name: 'Clear tags' })));

    await waitFor(() => expect(exposed().values).toEqual([]));
  });

  test('[ShadTagsInput-EVT-003] focusing and leaving the box fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => input().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => input().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadTagsInput-ACT-001] setTags replaces the tags within the rules, selectTags adds and deselectTags removes', async () => {
    render({ properties: { maxTags: binding('{{3}}') } });

    await widget.act('setTags', ['a', 'b', 'c', 'd', 'a']);
    await waitFor(() => expect(exposed().values).toEqual(['a', 'b', 'c']));
    await widget.act('deselectTags', ['B']);
    await waitFor(() => expect(exposed().values).toEqual(['a', 'c']));
    await widget.act('selectTags', ['extra']);
    await waitFor(() => expect(exposed().values).toEqual(['a', 'c', 'extra']));
    expect(chips()).toEqual(['a', 'c', 'extra']);
  });

  // Release audit 62: clear emptied the tags but left unfinished typed text, which leaving the box then added as a tag.
  test('[ShadTagsInput-ACT-003] clear drops unfinished typed text too, so leaving the box adds nothing', async () => {
    render({ properties: { addOnBlur: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onTagAdded', { key: 'added' }));
    await act(async () => input().focus());
    await type('unfinished');
    await widget.act('clear');
    expect(input()).toHaveValue('');
    await act(async () => input().blur());
    expect(exposed().values).toEqual([]);
    expect(widget.variables().added ?? 0).toBe(0);
  });

  test('[ShadTagsInput-ACT-002] clear removes every tag, and setFocus and setBlur move focus to and from the box', async () => {
    render();

    await widget.act('clear');
    await waitFor(() => expect(exposed().values).toEqual([]));
    await widget.act('setFocus');
    expect(document.activeElement).toBe(input());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(input());
  });

  test('[ShadTagsInput-VAL-004] a mandatory tags input with no tags is invalid until one is added', async () => {
    render({ properties: { defaultValue: binding('{{[]}}') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await type('one,');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadTagsInput-VAL-005] a customRule message makes the tags invalid and is shown once the box is left', async () => {
    render({
      validation: { customRule: binding("{{components.tagsinput1.values.includes('php') ? 'No PHP here' : ''}}") },
    });

    await act(async () => input().focus());
    await type('php,');
    await act(async () => input().blur());

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('No PHP here')).toBeInTheDocument();
  });

  test('[ShadTagsInput-STY-001] chip and accent styles reach the field as CSS variables', async () => {
    const { container } = render({
      styles: { accentColor: binding('#e11d48'), chipTextColor: binding('#14532d') },
    });

    await waitFor(() => expect(input()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-chip-fg')).toBe('#14532d');
  });
});
