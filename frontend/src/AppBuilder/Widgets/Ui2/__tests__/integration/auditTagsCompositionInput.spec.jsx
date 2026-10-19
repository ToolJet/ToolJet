// Release audit round 4 (Codex fixture auditTagsInputCompositionInputBoundary, trimmed): a comma typed while an IME
// composition was still open split the draft at once, so a provisional 東京 became a tag (firing onTagAdded and
// onChange, and taking a place under maxTags) before the composition settled on 東京支店. The draft is split only once
// the composition ends.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadTagsInput',
  id: 'tags1',
  handle: 'tags1',
  widgetWidth: 500,
  widgetHeight: 150,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const snapshot = (box) => ({
  draft: box.value,
  tags: w.exposed().values,
  added: w.variables().added || 0,
  changed: w.variables().changed || 0,
});
async function mount(maxTags = 10) {
  w.render({
    currentMode: 'view',
    properties: {
      label: binding('Locations'),
      defaultValue: binding('{{[]}}'),
      maxTags: binding(`{{${maxTags}}}`),
      allowCustomTags: binding('{{true}}'),
      addOnBlur: binding('{{false}}'),
      suggestions: binding('{{[]}}'),
    },
  });
  const box = await screen.findByRole('combobox', { name: 'Locations' });
  await waitFor(() => expect(w.exposed().values).toEqual([]));
  w.setEvents([
    ...countInvocationsOn('tags1', 'onTagAdded', { key: 'added' }),
    ...countInvocationsOn('tags1', 'onChange', { key: 'changed' }),
  ]);
  return box;
}
// An input event as the browser sends it, composing (insertCompositionText) or not.
const input = (box, value, composing) =>
  act(async () => {
    if (composing) fireEvent.compositionUpdate(box, { data: value });
    fireEvent.input(box, {
      target: { value },
      isComposing: composing,
      inputType: composing ? 'insertCompositionText' : 'insertText',
      data: value,
    });
  });
const enter = (box) => act(async () => fireEvent.keyDown(box, { key: 'Enter', code: 'Enter', keyCode: 13 }));

test('ordinary delimiter input still commits the completed tag and keeps the rest as the draft', async () => {
  const box = await mount();
  await input(box, 'Alpha,Beta', false);
  expect(snapshot(box)).toEqual({ draft: 'Beta', tags: ['Alpha'], added: 1, changed: 1 });
});

test('composition without a delimiter stays a draft until ordinary Enter commits once', async () => {
  const box = await mount();
  await act(async () => fireEvent.compositionStart(box));
  await input(box, '東京支店', true);
  expect(snapshot(box)).toEqual({ draft: '東京支店', tags: [], added: 0, changed: 0 });
  await act(async () => fireEvent.compositionEnd(box, { data: '東京支店' }));
  await enter(box);
  expect(snapshot(box)).toEqual({ draft: '', tags: ['東京支店'], added: 1, changed: 1 });
});

test.each([10, 1])(
  'provisional delimiters create no tag, fire no workflow and take no place under the limit (maxTags=%i)',
  async (maxTags) => {
    const box = await mount(maxTags);
    await act(async () => fireEvent.compositionStart(box));
    await input(box, '東京,支店', true);
    const provisional = snapshot(box);
    await input(box, '東京支店', true);
    await act(async () => fireEvent.compositionEnd(box, { data: '東京支店' }));
    await enter(box);
    expect({ provisional, final: snapshot(box) }).toEqual({
      provisional: { draft: '東京,支店', tags: [], added: 0, changed: 0 },
      final: { draft: '', tags: ['東京支店'], added: 1, changed: 1 },
    });
  }
);

test('a delimiter in the committed text splits once when the composition ends, whichever event comes last', async () => {
  const box = await mount();
  await act(async () => fireEvent.compositionStart(box));
  await input(box, '東京,大阪', true);
  await act(async () => fireEvent.compositionEnd(box, { data: '東京,大阪' }));
  expect(snapshot(box)).toEqual({ draft: '大阪', tags: ['東京'], added: 1, changed: 1 });
  // Safari sends the final, non-composing input after compositionend; it carries the draft left, not a second split.
  await input(box, box.value, false);
  expect(snapshot(box)).toEqual({ draft: '大阪', tags: ['東京'], added: 1, changed: 1 });
});
