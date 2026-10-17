/**
 * UI 2.0 text inputs: Enter that ends an IME composition is not "Enter pressed".
 *
 * Release audit 63 (17 Oct): typing Japanese, Chinese or Korean, the Enter that confirms the composed characters is a
 * keydown with isComposing set. The inputs fired onEnterPressed for it, and the Tags input turned the provisional text
 * into a tag (and cleared the draft). Chat already waited for the composition to end.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const TYPES = [
  'ShadInput',
  'ShadTextarea',
  'ShadPasswordInput',
  'ShadNumberInput',
  'ShadCurrencyInput',
  'ShadPhoneInput',
];
const harnesses = Object.fromEntries(
  [...TYPES, 'ShadTagsInput'].map((componentType) => [
    componentType,
    createWidgetHarness({ componentType, handle: 'widget1', id: ID, preload: [componentType] }),
  ])
);
const box = () => document.querySelector('input:not([type=hidden]), textarea');
const enter = (init) => act(async () => fireEvent.keyDown(box(), { key: 'Enter', code: 'Enter', ...init }));

describe('[UI2-IME-063] a composing Enter is not Enter pressed', () => {
  it.each(TYPES)('%s', async (componentType) => {
    const widget = harnesses[componentType];
    await widget.setup();
    try {
      widget.render({ currentMode: 'view' });
      await waitFor(() => expect(box()).not.toBeNull());
      widget.setEvents(countInvocationsOn(ID, 'onEnterPressed', { key: 'enters' }));
      await enter({ isComposing: true });
      await enter({ keyCode: 229 });
      expect(widget.variables().enters ?? 0).toBe(0);
      // The control: an ordinary Enter.
      await enter({});
      await waitFor(() => expect(widget.variables().enters).toBe(1));
    } finally {
      widget.teardown();
    }
  });

  it('ShadTagsInput keeps composing text as the draft, and adds it on an ordinary Enter', async () => {
    const widget = harnesses.ShadTagsInput;
    await widget.setup();
    try {
      widget.render({ currentMode: 'view' });
      await waitFor(() => expect(box()).not.toBeNull());
      widget.setEvents(countInvocationsOn(ID, 'onTagAdded', { key: 'added' }));
      await act(async () => fireEvent.change(box(), { target: { value: 'とう' } }));
      await enter({ isComposing: true });
      expect(widget.exposed().values).toEqual([]);
      expect(box()).toHaveValue('とう');
      expect(widget.variables().added ?? 0).toBe(0);
      await enter({});
      await waitFor(() => expect(widget.exposed().values).toEqual(['とう']));
      expect(widget.variables().added).toBe(1);
    } finally {
      widget.teardown();
    }
  });
});
