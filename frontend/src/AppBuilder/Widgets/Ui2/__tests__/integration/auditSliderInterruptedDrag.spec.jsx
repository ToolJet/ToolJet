// Release audit round 3 (Codex fixtures reviewSliderInterruptedPointer, reviewSliderInterruptedForm,
// reviewSliderRangeInterrupted and reviewSliderDraftReset, trimmed). A drag cut short by setDisable or setLoading
// left the thumb and aria-valuenow where it was dragged, though the value and the Form kept the old one; reset() and
// a setValue to the same value did not put it back. The thumbs followed only a change of the value or the bounds.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadSlider',
  id: 'slider1',
  handle: 'slider1',
  preload: ['Form'],
  widgetWidth: 400,
  widgetHeight: 120,
});
beforeEach(() => {
  w.setup();
  // jsdom has no pointer capture, which Radix's slider uses while dragging.
  const captures = new WeakMap();
  jest.spyOn(Element.prototype, 'setPointerCapture').mockImplementation(function (id) {
    captures.set(this, id);
  });
  jest.spyOn(Element.prototype, 'hasPointerCapture').mockImplementation(function (id) {
    return captures.get(this) === id;
  });
  jest.spyOn(Element.prototype, 'releasePointerCapture').mockImplementation(function () {
    captures.delete(this);
  });
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
});

const shown = () => screen.getAllByRole('slider').map((t) => Number(t.getAttribute('aria-valuenow')));
const mount = (value) => {
  w.renderInsideForm({
    properties: {
      defaultValue: binding(`{{${JSON.stringify(value)}}}`),
      min: binding('{{0}}'),
      max: binding('{{100}}'),
      step: binding('{{1}}'),
    },
  });
  w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
  w.setEvents([
    ...countInvocationsOn('slider1', 'onChange'),
    ...setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData}}' }),
  ]);
  const track = screen.getAllByRole('slider')[0].parentElement.parentElement;
  jest
    .spyOn(track, 'getBoundingClientRect')
    .mockReturnValue({ left: 0, top: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0, toJSON() {} });
  return track;
};
const drag = (track, from, to) => {
  fireEvent.pointerDown(track, { pointerId: 1, clientX: from, button: 0 });
  fireEvent.pointerMove(track, { pointerId: 1, clientX: to, button: 0 });
};
const submit = () => act(async () => w.exposed('form1').submitForm());

test.each(['setDisable', 'setLoading'])('a drag cut short by %s puts the thumb back on the value', async (action) => {
  const track = mount(50);
  drag(track, 60, 70);
  expect(shown()).toEqual([70]);
  await w.act(action, true);
  fireEvent.pointerUp(track, { pointerId: 1, clientX: 70, button: 0 });
  await w.act(action, false);
  expect({ value: w.exposed().value, events: w.variables().calls || 0 }).toEqual({ value: 50, events: 0 });
  expect(shown()).toEqual([50]);
  await submit();
  expect(w.variables().submitted).toEqual({ slider1: 50 });
});

test.each([0, 1])('a range drag of thumb %s cut short by setDisable puts it back', async (index) => {
  const track = mount([20, 80]);
  drag(track, index === 0 ? 25 : 75, index === 0 ? 30 : 70);
  expect(shown()).toEqual(index === 0 ? [30, 80] : [20, 70]);
  await w.act('setDisable', true);
  fireEvent.pointerUp(track, { pointerId: 1, clientX: index === 0 ? 30 : 70, button: 0 });
  await w.act('setDisable', false);
  expect(w.exposed().value).toEqual([20, 80]);
  expect(shown()).toEqual([20, 80]);
});

test.each([
  ['reset()', ['reset'], 50],
  ['setValue to the same value', ['setValue', 50], 50],
  ['setValue to another value', ['setValue', 40], 40],
])('%s while a drag is held puts the thumb on the value', async (_, call, expected) => {
  const track = mount(50);
  drag(track, 60, 70);
  await w.act(...call);
  expect(w.exposed().value).toBe(expected);
  expect(shown()).toEqual([expected]);
});
