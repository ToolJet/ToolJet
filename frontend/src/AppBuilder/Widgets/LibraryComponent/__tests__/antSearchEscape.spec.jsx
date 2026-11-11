import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-07: typing 'mo' in an Ant Design AutoComplete and pressing Escape emptied the field and its value, and the list
// stayed open (over a Form's Submit button). antd closed the list, but its field is an <input type="search">, which the
// browser empties on Escape, and antd took that as typing: the list opened again with every option. The pack's
// AutoComplete, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

let mounts = 0;
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey={`ant-search-escape-${mounts}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`field-${mounts}`}
    />
  );
  const input = () => view.container.querySelector(`[data-cy="field-${mounts}"]`).shadowRoot.querySelector('input');
  await waitFor(() => expect(input()).toBeTruthy());
  return { input, exposed };
};

const type = (input, text) =>
  act(() => {
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: text } });
  });

// Escape as a browser handles it in the field: rc-select's field is an <input type="search">, and unless a handler took
// the key (preventDefault), the browser empties the field and fires input, once the key's handlers have run and the
// page has drawn. jsdom has no such default; it is done here.
const ESCAPE = { key: 'Escape', code: 'Escape', keyCode: 27, which: 27 };
const pressEscape = (input) => {
  let notTaken = true;
  act(() => {
    notTaken = fireEvent.keyDown(input, ESCAPE);
  });
  if (notTaken && input.type === 'search' && input.value !== '')
    act(() => {
      fireEvent.input(input, { target: { value: '' } });
    });
  act(() => {
    fireEvent.keyUp(input, ESCAPE);
  });
};

describe('Ant Design search fields: Escape', () => {
  test('[PackComponent-SEARCHESC-001] AutoComplete: Escape closes the list and keeps the typed text and value', async () => {
    const field = await mount('AutoComplete', {});
    type(field.input(), 'mo');
    await waitFor(() => expect(field.input().getAttribute('aria-expanded')).toBe('true'));
    expect(field.exposed.value).toBe('mo');

    pressEscape(field.input());

    await waitFor(() => expect(field.input().getAttribute('aria-expanded')).toBe('false'));
    expect(field.input().value).toBe('mo');
    expect(field.exposed.value).toBe('mo');
  });
});
