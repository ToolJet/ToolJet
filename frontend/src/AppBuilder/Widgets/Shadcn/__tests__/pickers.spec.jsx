import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  ShadColorPicker,
  ShadCombobox,
  ShadFileUpload,
  ShadMultiselect,
  ShadRating,
  ShadTagsInput,
} from '../ShadPickers';
import * as configs from '../../../WidgetManager/shadcnSource.pickers';

// jsdom lacks what Radix's popper and cmdk's list reach for.
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
});

/** A config's definition properties as the widget receives them: '{{...}}' resolved. */
const defaultsOf = (config) =>
  Object.fromEntries(
    Object.entries(config.definition.properties).map(([key, { value }]) => {
      const match = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
      return [key, match ? new Function(`return (${match[1]});`)() : value]; // eslint-disable-line no-new-func
    })
  );

const mandatory = (value) =>
  value === '' || value === false || value === undefined
    ? { isValid: false, validationError: 'Field cannot be empty' }
    : { isValid: true };

const mount = (Widget, name, config, properties = {}, extra = {}) => {
  const exposed = {};
  const events = [];
  const view = render(
    <Widget
      id="w1"
      componentType={name}
      properties={{ ...defaultsOf(config), ...properties }}
      styles={{}}
      validation={{}}
      validate={() => ({ isValid: true })}
      setExposedVariables={(values) => Object.assign(exposed, values)}
      setExposedVariable={(key, value) => (exposed[key] = value)}
      fireEvent={(event) => events.push(event)}
      height={64}
      width={320}
      {...extra}
    />
  );
  return { exposed, events, view };
};

const JUNK = {
  label: { a: 1 },
  description: null,
  options: [null, {}, { value: { a: 1 } }, 'x', 5, { label: {}, value: '' }, { value: 1 }, { value: '1' }, [1]],
  defaultValue: { x: 1 },
  placeholder: 7,
  suggestions: 42,
  maxTags: 'lots',
  tagPattern: '([',
  swatches: 'nope',
  max: 'abc',
  valueLabels: { a: 1 },
  accept: 12,
  maxSize: -5,
  maxFiles: 'many',
  maxSelections: Infinity,
  maxVisibleChips: -1,
  icon: 'rocket',
  size: 'huge',
};

const WIDGETS = [
  [ShadCombobox, 'ShadCombobox', configs.shadComboboxConfig],
  [ShadMultiselect, 'ShadMultiselect', configs.shadMultiselectConfig],
  [ShadTagsInput, 'ShadTagsInput', configs.shadTagsInputConfig],
  [ShadColorPicker, 'ShadColorPicker', configs.shadColorPickerConfig],
  [ShadRating, 'ShadRating', configs.shadRatingConfig],
  [ShadFileUpload, 'ShadFileUpload', configs.shadFileUploadConfig],
];

describe.each(WIDGETS)('%p renders', (Widget, name, config) => {
  it('with its defaults, exposing the standard state', () => {
    const { exposed, view } = mount(Widget, name, config);
    expect(view.container.querySelector('.tj-shadcn')).toBeTruthy();
    expect(exposed).toMatchObject({ isVisible: true, isLoading: false, isDisabled: false });
  });

  it('with junk properties, loading and disabled, without throwing', () => {
    expect(() => mount(Widget, name, config, JUNK)).not.toThrow();
    expect(() => mount(Widget, name, config, { ...JUNK, loadingState: true, disabledState: true })).not.toThrow();
    expect(() => mount(Widget, name, config, { visibility: false })).not.toThrow();
  });
});

describe('ShadCombobox', () => {
  const open = () => fireEvent.click(screen.getByRole('combobox'));

  it('selects an option from the searchable menu and fires onSelect and onChange', () => {
    const { exposed, events } = mount(ShadCombobox, 'ShadCombobox', configs.shadComboboxConfig);
    expect(exposed).toMatchObject({ value: '', selectedOption: {} });
    expect(exposed.options).toHaveLength(6);
    open();
    fireEvent.change(screen.getByPlaceholderText('Search countries...'), { target: { value: 'ger' } });
    expect(exposed.searchText).toBe('ger');
    expect(events).toContain('onSearchTextChanged');
    expect(screen.queryByText('Japan')).toBeNull();
    fireEvent.click(screen.getByText('Germany'));
    expect(exposed.value).toBe('de');
    expect(exposed.selectedOption).toMatchObject({ label: 'Germany', group: 'Europe' });
    expect(events.slice(-2)).toEqual(['onSelect', 'onChange']);
    expect(screen.getByRole('combobox').textContent).toContain('Germany');
  });

  it('keys items by position: an option valued "" and duplicate labels stay distinct', () => {
    const options = [
      { label: 'All', value: '' },
      { label: 'Same', value: 1 },
      { label: 'Same', value: 2 },
    ];
    const { exposed } = mount(ShadCombobox, 'ShadCombobox', configs.shadComboboxConfig, { options });
    open();
    fireEvent.click(screen.getAllByText('Same')[1]);
    expect(exposed.value).toBe(2);
    open();
    fireEvent.click(screen.getByText('All'));
    expect(exposed.value).toBe('');
    expect(exposed.selectedOption.label).toBe('All');
  });

  it('offers selectOption and clear, and validates a mandatory pick', async () => {
    const { exposed } = mount(
      ShadCombobox,
      'ShadCombobox',
      configs.shadComboboxConfig,
      {},
      { validate: mandatory, validation: { mandatory: true } }
    );
    expect(exposed).toMatchObject({ isValid: false, isMandatory: true });
    await act(() => exposed.selectOption('uk'));
    expect(exposed.value).toBe('uk');
    expect(exposed.isValid).toBe(true);
    await act(() => exposed.clear());
    expect(exposed.value).toBe('');
  });
});

describe('ShadMultiselect', () => {
  it('toggles options in the menu and removes chips', () => {
    const { exposed, events } = mount(ShadMultiselect, 'ShadMultiselect', configs.shadMultiselectConfig);
    expect(exposed.values).toEqual(['design', 'engineering']);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Marketing'));
    expect(exposed.values).toEqual(['design', 'engineering', 'marketing']);
    expect(events.slice(-2)).toEqual(['onSelect', 'onChange']);
    fireEvent.click(screen.getByLabelText('Remove Design'));
    expect(exposed.values).toEqual(['engineering', 'marketing']);
    expect(exposed.selectedOptions.map((o) => o.label)).toEqual(['Engineering', 'Marketing']);
  });

  it('selects all, respects maxSelections and shows +N past the visible chips', () => {
    const { exposed } = mount(ShadMultiselect, 'ShadMultiselect', configs.shadMultiselectConfig, {
      defaultValue: [],
      maxVisibleChips: 2,
    });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Select all'));
    expect(exposed.values).toHaveLength(5);
    expect(screen.getByText('+3 more')).toBeTruthy();
  });

  it('disables unpicked options at the limit', () => {
    const { exposed } = mount(ShadMultiselect, 'ShadMultiselect', configs.shadMultiselectConfig, {
      defaultValue: ['design'],
      maxSelections: 1,
    });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Sales'));
    expect(exposed.values).toEqual(['design']);
    expect(screen.getByText('1 of 1 selected')).toBeTruthy();
  });

  it('offers selectOptions, deselectOptions and clear, and a mandatory check needs one pick', async () => {
    const { exposed } = mount(
      ShadMultiselect,
      'ShadMultiselect',
      configs.shadMultiselectConfig,
      { defaultValue: [] },
      { validate: mandatory, validation: { mandatory: true } }
    );
    expect(exposed.isValid).toBe(false);
    await act(() => exposed.selectOptions(['sales', 'support', 'nope']));
    expect(exposed.values).toEqual(['sales', 'support']);
    expect(exposed.isValid).toBe(true);
    await act(() => exposed.deselectOptions('sales'));
    expect(exposed.values).toEqual(['support']);
    await act(() => exposed.clear());
    expect(exposed.values).toEqual([]);
  });
});

describe('ShadTagsInput', () => {
  const input = () => screen.getByPlaceholderText('Add a tag...');

  it('adds on Enter and comma, refuses duplicates and removes the last on Backspace', () => {
    const { exposed, events } = mount(ShadTagsInput, 'ShadTagsInput', configs.shadTagsInputConfig);
    expect(exposed.tags).toEqual(['react', 'typescript']);
    fireEvent.change(input(), { target: { value: 'vue' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(exposed.tags).toEqual(['react', 'typescript', 'vue']);
    expect(exposed.value).toEqual(exposed.tags);
    expect(exposed.lastAddedTag).toBe('vue');
    expect(events.slice(-2)).toEqual(['onTagAdded', 'onChange']);
    fireEvent.change(input(), { target: { value: 'go,rust,' } });
    expect(exposed.tags.slice(-2)).toEqual(['go', 'rust']);
    fireEvent.change(input(), { target: { value: 'React' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toBe('"React" is already added');
    expect(exposed.tags).toHaveLength(5);
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.keyDown(input(), { key: 'Backspace' });
    expect(exposed.tags).toEqual(['react', 'typescript', 'vue', 'go']);
    expect(exposed.lastRemovedTag).toBe('rust');
    expect(events.slice(-2)).toEqual(['onTagRemoved', 'onChange']);
    fireEvent.click(screen.getByLabelText('Remove react'));
    expect(exposed.tags[0]).toBe('typescript');
  });

  it('picks suggestions, applies the pattern and maxTags, and offers setTags and clear', async () => {
    const { exposed } = mount(ShadTagsInput, 'ShadTagsInput', configs.shadTagsInputConfig, {
      defaultValue: [],
      tagPattern: '^[a-z]+$',
      patternError: 'Lowercase letters only',
      maxTags: 2,
    });
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: 'pyt' } });
    fireEvent.click(screen.getByRole('option', { name: 'python' }));
    expect(exposed.tags).toEqual(['python']);
    fireEvent.change(input(), { target: { value: 'Bad1' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(screen.getByRole('alert').textContent).toBe('Lowercase letters only');
    await act(() => exposed.setTags(['a', 'b', 'c', 'a']));
    expect(exposed.tags).toEqual(['a', 'b']);
    await act(() => exposed.clear());
    expect(exposed.tags).toEqual([]);
  });
});

describe('ShadColorPicker', () => {
  it('exposes hex and rgb, picks swatches and typed hex, and fires onChange', async () => {
    const { exposed, events } = mount(ShadColorPicker, 'ShadColorPicker', configs.shadColorPickerConfig);
    expect(exposed).toMatchObject({ value: '#6366f1', rgb: 'rgb(99, 102, 241)', rgba: 'rgba(99, 102, 241, 1)' });
    fireEvent.click(screen.getByText('#6366f1'));
    fireEvent.click(screen.getByRole('button', { name: '#22c55e' }));
    expect(exposed.value).toBe('#22c55e');
    expect(exposed.rgb).toBe('rgb(34, 197, 94)');
    expect(events).toEqual(['onChange']);
    const hex = screen.getByLabelText('Hex color');
    fireEvent.change(hex, { target: { value: 'abc' } });
    fireEvent.keyDown(hex, { key: 'Enter' });
    expect(exposed.value).toBe('#aabbcc');
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Hue' }), { key: 'ArrowRight', shiftKey: true });
    expect(exposed.value).not.toBe('#aabbcc');
    await act(() => exposed.setColor('rgb(255, 0, 0)'));
    expect(exposed.value).toBe('#ff0000');
    await act(() => exposed.setColor('not a colour'));
    expect(exposed.value).toBe('#ff0000');
  });

  it('keeps alpha when allowed', async () => {
    const { exposed } = mount(ShadColorPicker, 'ShadColorPicker', configs.shadColorPickerConfig, {
      allowAlpha: true,
      defaultValue: '#ff000080',
    });
    expect(exposed.value).toBe('#ff000080');
    expect(exposed.rgba).toBe('rgba(255, 0, 0, 0.5)');
  });
});

describe('ShadRating', () => {
  it('rates by click and keyboard, clears on a second click, and fires onChange', async () => {
    const { exposed, events } = mount(ShadRating, 'ShadRating', configs.shadRatingConfig);
    expect(exposed.value).toBe(4);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[3].getAttribute('aria-checked')).toBe('true');
    expect(radios[3].tabIndex).toBe(0);
    fireEvent.click(radios[1]);
    expect(exposed.value).toBe(2);
    expect(events).toEqual(['onChange']);
    fireEvent.click(radios[1]);
    expect(exposed.value).toBe(0);
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(exposed.value).toBe(5);
    fireEvent.keyDown(radios[4], { key: 'ArrowLeft' });
    expect(exposed.value).toBe(4);
    expect(document.activeElement).toBe(radios[3]);
    await act(() => exposed.setValue(99));
    expect(exposed.value).toBe(5);
    await act(() => exposed.clear());
    expect(exposed.value).toBe(0);
  });

  it('clamps the icon count, shows value labels, and ignores input when read only', () => {
    const { exposed } = mount(ShadRating, 'ShadRating', configs.shadRatingConfig, {
      max: 50,
      readOnly: true,
      showValue: true,
      defaultValue: 3,
      valueLabels: ['a', 'b', 'Okay'],
    });
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(10);
    expect(screen.getByText('Okay')).toBeTruthy();
    fireEvent.click(radios[0]);
    expect(exposed.value).toBe(3);
  });
});

describe('ShadFileUpload', () => {
  const fileInput = (view) => view.container.querySelector('input[type=file]');

  it('reads dropped files like the native file picker and removes them', async () => {
    const { exposed, events, view } = mount(ShadFileUpload, 'ShadFileUpload', configs.shadFileUploadConfig, {
      accept: '',
    });
    expect(exposed.files).toEqual([]);
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput(view), { target: { files: [file] } });
    await waitFor(() => expect(exposed.files).toHaveLength(1));
    const [exposedFile] = exposed.files;
    expect(exposedFile).toMatchObject({ name: 'notes.txt', type: 'text/plain', size: 11 });
    expect(String(exposedFile.content)).toBe('hello world');
    expect(String(exposedFile.base64Data)).toBe(btoa('hello world'));
    expect(String(exposedFile.dataURL)).toMatch(/^data:text\/plain;base64,/);
    expect(exposed.fileSize).toBe(11);
    expect(events).toEqual(['onFileSelected']);
    expect(screen.getByText('notes.txt')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Remove notes.txt'));
    expect(exposed.files).toEqual([]);
    expect(events).toEqual(['onFileSelected', 'onFileDeselected']);
  });

  it('shows an error line for refused files and parses CSV when asked', async () => {
    const { exposed, view } = mount(ShadFileUpload, 'ShadFileUpload', configs.shadFileUploadConfig, {
      accept: 'image/*',
    });
    fireEvent.change(fileInput(view), { target: { files: [new File(['x'], 'a.txt', { type: 'text/plain' })] } });
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('"a.txt" is not an accepted file type'));
    expect(exposed.files).toEqual([]);
    view.unmount();

    const parsed = mount(ShadFileUpload, 'ShadFileUpload', configs.shadFileUploadConfig, {
      accept: '.csv,text/csv',
      parseContent: true,
    });
    const csv = new File(['name,qty\nTea,2'], 'items.csv', { type: 'text/csv' });
    fireEvent.change(fileInput(parsed.view), { target: { files: [csv] } });
    await waitFor(() => expect(parsed.exposed.files).toHaveLength(1));
    expect(parsed.exposed.files[0].parsedData).toEqual([{ name: 'Tea', qty: '2' }]);
    await act(() => parsed.exposed.clearFiles());
    expect(parsed.exposed.files).toEqual([]);
  });

  it('keeps to maxFiles and validates a mandatory upload', async () => {
    const { exposed, view } = mount(
      ShadFileUpload,
      'ShadFileUpload',
      configs.shadFileUploadConfig,
      { accept: '', maxFiles: 1 },
      { validate: mandatory, validation: { mandatory: true } }
    );
    expect(exposed.isValid).toBe(false);
    const files = [new File(['a'], 'a.txt', { type: 'text/plain' }), new File(['b'], 'b.txt', { type: 'text/plain' })];
    fireEvent.change(fileInput(view), { target: { files } });
    await waitFor(() => expect(exposed.files).toHaveLength(1));
    expect(exposed.isValid).toBe(true);
    expect(within(view.container).getByRole('alert').textContent).toBe('You can upload up to 1 file');
  });
});
