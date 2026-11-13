import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 38: Enter in a pack input inside a ToolJet Form did not submit it. A native Text Input submits through the
// browser's implicit submission: Enter in a field of a <form> clicks the form's default button (the Form's Submit
// Button, whose click submits the Form). A pack's input is inside the widget's shadow root, which the <form> does not
// reach, so the browser never did that for it. The host now does, as the browser would: a single-line field's Enter
// that the component left alone clicks the form's default button. The pack components, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  antd: require('../../../../../../packs/antd/src/index.ts'),
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
// A pack component in a <form> whose default button is a ToolJet Button (type="default", which a browser takes as a
// submit button), as a Form's Submit button renders.
const mountInForm = async (pack, name, { inForm = true, props = {} } = {}) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  mounts += 1;
  const submits = jest.fn();
  const events = [];
  const Wrapper = inForm ? 'form' : 'div';
  const view = render(
    <Wrapper onSubmit={(e) => e.preventDefault()}>
      <InlineLibraryComponent
        bundleUrl={`${pack}.js`}
        cssUrl={`${pack}.css`}
        cacheKey={`form-enter-${pack}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={makeHost(name, {})}
        dataCy={`enter-${mounts}`}
      />
      <button type="default" onClick={submits}>
        Submit
      </button>
    </Wrapper>
  );
  const root = view.container.querySelector(`[data-cy="enter-${mounts}"]`);
  await waitFor(() => expect(root.shadowRoot?.querySelector('input, textarea')).toBeTruthy());
  return { field: root.shadowRoot.querySelector('textarea, input'), submits, events };
};

const pressEnter = (field, init = {}) =>
  act(() => {
    field.focus();
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true, ...init })
    );
  });

describe('Enter in a pack field inside a form', () => {
  it.each([
    ['shadcn', 'Input'],
    ['antd', 'Input'],
    ['mui', 'TextField'],
    ['shadcn', 'NumberInput'],
  ])('%s %s submits it, as a native Text Input does', async (pack, name) => {
    const { field, submits } = await mountInForm(pack, name);
    pressEnter(field);
    expect(submits).toHaveBeenCalledTimes(1);
  });

  it('still fires the field’s own Enter event', async () => {
    const { field, events } = await mountInForm('shadcn', 'Input');
    pressEnter(field);
    expect(events).toContain('onEnterPressed');
  });

  it.each([
    ['shadcn', 'Textarea'],
    ['antd', 'TextArea'],
    ['mui', 'MultilineTextField'],
  ])('%s %s takes Enter as a new line, without submitting', async (pack, name) => {
    const { field, submits } = await mountInForm(pack, name);
    expect(field.tagName).toBe('TEXTAREA');
    pressEnter(field);
    expect(submits).not.toHaveBeenCalled();
  });

  it('does not submit while a word is being composed (IME)', async () => {
    const { field, submits } = await mountInForm('shadcn', 'Input');
    pressEnter(field, { isComposing: true });
    expect(submits).not.toHaveBeenCalled();
  });

  it('does not submit when the component used the Enter itself', async () => {
    const { field, submits } = await mountInForm('shadcn', 'Input');
    field.addEventListener('keydown', (e) => e.preventDefault());
    pressEnter(field);
    expect(submits).not.toHaveBeenCalled();
  });

  it('takes Enter in a field with an open list as picking from it, without submitting', async () => {
    // Ant's AutoComplete picks the active option on Enter without marking the Enter used.
    const { field, submits } = await mountInForm('antd', 'AutoComplete', {
      props: { options: [{ label: 'Apple', value: 'apple' }] },
    });
    act(() => field.focus());
    fireEvent.change(field, { target: { value: 'App' } });
    fireEvent.keyDown(field, { key: 'ArrowDown' });
    await waitFor(() => expect(field.getAttribute('aria-expanded')).toBe('true'));
    pressEnter(field);
    expect(submits).not.toHaveBeenCalled();
  });

  it('does nothing outside a form', async () => {
    const { field, submits } = await mountInForm('shadcn', 'Input', { inForm: false });
    pressEnter(field);
    expect(submits).not.toHaveBeenCalled();
  });
});
