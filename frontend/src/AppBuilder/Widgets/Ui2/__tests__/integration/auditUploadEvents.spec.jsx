// Release audit round 3 (Codex fixtures reviewUploadEventValidity, reviewUploadImmediateForm and
// reviewUploadRemovalForm, trimmed): FileUpload fired onFileSelected, onFileLoaded and onFileDeselected before isValid
// and the Form's formData caught up, so a required upload's handler read isValid false after a pick, and a Form
// submitted from onFileSelected sent no file. The files are now published before the events fire, as the text inputs
// do. (With validateOnSubmit on, the Form's own check is core Form work and not covered here.)
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadFileUpload',
  id: 'up1',
  handle: 'up1',
  preload: ['Form'],
  widgetWidth: 440,
  widgetHeight: 220,
});
const required = { properties: { accept: binding('') }, validation: { mandatory: binding('{{true}}') } };
const pick = (view) =>
  act(async () =>
    fireEvent.change(view.container.querySelector('input[type=file]'), {
      target: { files: [new File(['abc'], 'audit.txt', { type: 'text/plain' })] },
    })
  );
const submitFrom = (event) => ({
  id: 'auto-submit',
  index: 0,
  sourceId: 'up1',
  target: 'component',
  name: 'Submit from upload',
  event: {
    eventId: event,
    actionId: 'control-component',
    componentId: 'form1',
    componentSpecificActionHandle: 'submitForm',
    componentSpecificActionParams: [],
  },
});
const recordSubmit = () => [
  ...setVariableOn('form1', 'onSubmit', { key: 'submitted', value: '{{components.form1.formData}}' }),
  ...setVariableOn('form1', 'onInvalid', { key: 'invalid', value: 'YES' }),
];
const noValidateOnSubmit = () => {
  w.setComponentProperty('form1', 'resetOnSubmit', '{{false}}', 'properties');
  w.setComponentProperty('form1', 'validateOnSubmit', '{{false}}', 'properties');
};

let baseline;
beforeEach(() => {
  w.setup();
  baseline = registrySize();
});
afterEach(() => {
  w.teardown();
  expect(registrySize()).toBe(baseline);
});

test.each([false, true])('file events read the current files and validity (inside a Form: %s)', async (inForm) => {
  const opts = { ...required, properties: { ...required.properties, multiple: binding('{{true}}') } };
  const view = inForm ? w.renderInsideForm(opts) : w.render({ currentMode: 'view', ...opts });
  await act(async () =>
    w.setEvents(
      ['onFileSelected', 'onFileLoaded', 'onFileDeselected'].flatMap((event) =>
        setVariableOn('up1', event, {
          key: 'history',
          value: `{{[...(variables.history||[]),{event:'${event}',count:components.up1.file.length,valid:components.up1.isValid}]}}`,
        })
      )
    )
  );
  await waitFor(() => expect(w.exposed().isValid).toBe(false));
  await pick(view);
  await waitFor(() => expect(w.exposed().isValid).toBe(true));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove audit.txt' })));
  await waitFor(() => expect(w.exposed().isValid).toBe(false));
  expect(w.variables().history).toEqual([
    { event: 'onFileSelected', count: 1, valid: true },
    { event: 'onFileLoaded', count: 1, valid: true },
    { event: 'onFileDeselected', count: 0, valid: false },
  ]);
});

test.each(['onFileSelected', 'onFileLoaded'])('a Form submitted from %s sends the picked file', async (event) => {
  const view = w.renderInsideForm(required);
  await act(async () => {
    noValidateOnSubmit();
    w.setEvents([...recordSubmit(), submitFrom(event)]);
  });
  await pick(view);
  await waitFor(() => expect(w.exposed().isValid).toBe(true));
  expect(w.variables()).toEqual({ submitted: { up1: [expect.objectContaining({ name: 'audit.txt' })] } });
});

test('a Form submitted from onFileDeselected sends the list without the removed file', async () => {
  const view = w.renderInsideForm(required);
  await act(async () => noValidateOnSubmit());
  await pick(view);
  await waitFor(() => expect(w.exposed('form1').formData.up1).toHaveLength(1));
  await act(async () => w.setEvents([...recordSubmit(), submitFrom('onFileDeselected')]));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove audit.txt' })));
  await waitFor(() => expect(w.exposed('form1').formData.up1).toEqual([]));
  expect(w.variables()).toEqual({ submitted: { up1: [] } });
});
