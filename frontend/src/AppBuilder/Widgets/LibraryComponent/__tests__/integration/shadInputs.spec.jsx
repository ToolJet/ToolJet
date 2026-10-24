import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { OtpInput } from '../../../../../../../packs/shadcn/src/components/OtpInput';
import { CurrencyInput } from '../../../../../../../packs/shadcn/src/components/CurrencyInput';
import { NumberInput } from '../../../../../../../packs/shadcn/src/components/NumberInput';
import { TagsInput } from '../../../../../../../packs/shadcn/src/components/TagsInput';
import { Slider } from '../../../../../../../packs/shadcn/src/components/Slider';
import { Rating } from '../../../../../../../packs/shadcn/src/components/Rating';
import { TOO_COMPLEX, boundedRegex } from '../../../../../../../packs/shadcn/src/lib/safeRegex';
import { addTags } from '../../../../../../../packs/shadcn/src/lib/ui2/inputs/model';
import { matchesCondition } from '../../../../../../../packs/shadcn/src/lib/ui2/table/model';

// The shadcn pack inputs' state transitions and author regexes (pack audit SP-01, SP-27, SP-33, SP-34 and SP-35,
// 2026-10-23): a Form's clear also clears a field's own drafts and derived exposed values, an empty bound default
// clears, literal bounds known at mount fit the exposed value, and TagsInput / DataTable patterns run with bounded work.
// The pack components, the inline SDK, the host renderer and the Form signal are the real ones; only the module and CSS
// loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

beforeAll(() => {
  // Radix's Slider measures its thumbs; jsdom has no ResizeObserver.
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

const COMPONENTS = { OtpInput, CurrencyInput, NumberInput, TagsInput, Slider, Rating };

// Mounts one pack field in a Form; rerender(props, clearCount) changes its props or clears the Form.
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const host = {
    formField: true,
    fieldId: `inputs-${name}`,
    disabled: false,
    loading: false,
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  };
  const make = (componentProps, clearCount) => (
    <FormSignalContext.Provider value={{ clearCount, submitAttemptCount: 0 }}>
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={`shad-inputs-${name}`}
        componentName={name}
        componentProps={componentProps}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={() => {}}
        actions={new Map()}
        host={host}
        dataCy="pack-input"
      />
    </FormSignalContext.Provider>
  );
  const view = render(make(props, 0));
  const root = () => view.container.querySelector('[data-cy="pack-input"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ui')).toBeTruthy());
  return { exposed, root, rerender: (next, clearCount = 0) => view.rerender(make(next, clearCount)) };
};

describe('a Form clear on a shadcn pack input', () => {
  it('OtpInput: leaves the code empty and not complete', async () => {
    const props = { length: 4, defaultValue: '1234' };
    const { exposed, rerender } = await mount('OtpInput', props);
    await waitFor(() => expect(exposed.isComplete).toBe(true));
    expect(exposed.value).toBe('1234');
    rerender(props, 1);
    await waitFor(() => expect(exposed.value).toBe(''));
    expect(exposed.isComplete).toBe(false);
  });

  it('CurrencyInput: clears the focused draft and formattedValue', async () => {
    const props = { defaultValue: '12.34' };
    const { exposed, root, rerender } = await mount('CurrencyInput', props);
    await waitFor(() => expect(exposed.formattedValue).toBe('$12.34'));
    const input = root().querySelector('input.ui2-inner');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '987.65' } });
    await waitFor(() => expect(exposed.formattedValue).toBe('$987.65'));
    rerender(props, 1);
    await waitFor(() => expect(exposed.value).toBe(null));
    expect(input.value).toBe('');
    expect(exposed.formattedValue).toBe('');
  });

  it('NumberInput: clears the focused draft', async () => {
    const props = { defaultValue: 3 };
    const { exposed, root, rerender } = await mount('NumberInput', props);
    const input = root().querySelector('input.ui2-inner');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '987.65' } });
    await waitFor(() => expect(exposed.value).toBe(987.65));
    rerender(props, 1);
    await waitFor(() => expect(exposed.value).toBe(null));
    expect(input.value).toBe('');
  });

  it('TagsInput: clears newTagsAdded and drops the unfinished text, so blur adds nothing', async () => {
    const props = { defaultValue: ['custom-initial'], suggestions: [], addOnBlur: true };
    const { exposed, root, rerender } = await mount('TagsInput', props);
    await waitFor(() => expect(exposed.newTagsAdded).toEqual(['custom-initial']));
    const input = root().querySelector('input.ui2-tags-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'pending' } });
    expect(input.value).toBe('pending');
    rerender(props, 1);
    await waitFor(() => expect(exposed.values).toEqual([]));
    expect(exposed.newTagsAdded).toEqual([]);
    expect(input.value).toBe('');
    fireEvent.blur(input);
    await act(async () => {});
    expect(exposed.values).toEqual([]);
  });
});

describe('an empty bound default on a shadcn pack input', () => {
  it('OtpInput: clears the old code', async () => {
    const { exposed, rerender } = await mount('OtpInput', { length: 4, defaultValue: '1234' });
    await waitFor(() => expect(exposed.isComplete).toBe(true));
    rerender({ length: 4, defaultValue: '' });
    await waitFor(() => expect(exposed.value).toBe(''));
    expect(exposed.isComplete).toBe(false);
  });

  it('TagsInput: clears the old tags', async () => {
    const { exposed, rerender } = await mount('TagsInput', { defaultValue: ['custom-initial'], suggestions: [] });
    await waitFor(() => expect(exposed.values).toEqual(['custom-initial']));
    rerender({ defaultValue: [], suggestions: [] });
    await waitFor(() => expect(exposed.values).toEqual([]));
    expect(exposed.newTagsAdded).toEqual([]);
  });

  it('TagsInput: on mount an empty default still leaves an app-set value alone', async () => {
    const { exposed } = await mount('TagsInput', { values: ['kept'], suggestions: [] });
    await act(async () => {});
    expect(exposed.values).toEqual(['kept']);
  });
});

describe('literal bounds known at mount', () => {
  it('Slider: exposes the drawn, clamped value under the untouched default', async () => {
    const { exposed, root } = await mount('Slider', { min: 0, max: 10 });
    await waitFor(() => expect(exposed.value).toBe(10));
    expect(root().querySelector('[role="slider"]').getAttribute('aria-valuenow')).toBe('10');
  });

  it('Slider: leaves a value within the bounds as the app set it', async () => {
    const { exposed } = await mount('Slider', { min: 0, max: 100, value: 30 });
    await act(async () => {});
    expect(exposed.value).toBe(30);
  });

  it('Rating: exposes the drawn rating under the untouched default', async () => {
    const { exposed, root } = await mount('Rating', { max: 3 });
    await waitFor(() => expect(exposed.value).toBe(3));
    expect(root().querySelectorAll('[role="radio"][aria-checked="true"]').length).toBe(1);
  });
});

describe('author regexes in the shadcn pack', () => {
  // ^(a+)+$ on 33 characters takes seconds in a native RegExp; the bounded matcher answers within its work limit.
  it('the bounded matcher answers a catastrophic-backtracking pattern quickly', () => {
    const re = boundedRegex('^(a+)+$', 'i');
    const started = Date.now();
    expect(re.match(`${'a'.repeat(32)}!`)).toBe(false);
    expect(re.match('a'.repeat(32))).toBe(true);
    expect(Date.now() - started).toBeLessThan(250);
  });

  it('keeps ordinary semantics, flags and invalid patterns', () => {
    expect(boundedRegex('^[a-z0-9-]+$').test('react-18')).toBe(true);
    expect(boundedRegex('^[a-z0-9-]+$').test('React')).toBe(false);
    expect(boundedRegex('^[a-z]+$', 'i').test('React')).toBe(true);
    expect(boundedRegex('(a)\\1').test('xaa')).toBe(true);
    expect(boundedRegex('(?<=x)a').test('xa')).toBe(true);
    expect(boundedRegex('(')).toBe(null);
  });

  // Text past the backtracking matcher's cap is TOO_COMPLEX for a lookahead pattern, where a native RegExp would match
  // at once: these cases show both consumers go through the bounded matcher without running a hostile pattern here.
  const LONG = 'a'.repeat(300);
  it('TagsInput refuses a tag its pattern cannot be checked on, and still checks ordinary tags', () => {
    expect(boundedRegex('^(?=a)a+$').match(LONG)).toBe(TOO_COMPLEX);
    const refused = addTags([], [LONG], { pattern: '^(?=a)a+$' });
    expect(refused.tags).toEqual([]);
    expect(refused.error).toMatch(/too complex/);
    expect(addTags([], ['ok-tag', 'Bad Tag'], { pattern: '^[a-z-]+$' }).tags).toEqual(['ok-tag']);
  });

  it('a DataTable regex rule holds for no cell it cannot check, and still matches ordinary cells', () => {
    expect(matchesCondition(LONG, 'matches', '(?=a)a+')).toBe(false);
    expect(matchesCondition(LONG, 'nl', '(?=a)a+')).toBe(false);
    expect(matchesCondition('Alpha', 'matches', '^al')).toBe(true);
    expect(matchesCondition('Alpha', 'nl', '^al')).toBe(false);
    expect(matchesCondition('Beta', 'nl', '^al')).toBe(true);
  });
});
