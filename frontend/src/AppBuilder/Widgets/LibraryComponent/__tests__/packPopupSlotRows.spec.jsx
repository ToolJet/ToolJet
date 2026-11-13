import React from 'react';
import { act, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { usePackHost } from '@/AppBuilder/Widgets/LibraryComponent/usePackHost';
import SubcontainerContext from '@/AppBuilder/_contexts/SubcontainerContext';
import { installBrowserStubs } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-05: an Ant Design Modal or Drawer in each row of a List view: row 1's dialog showed every row's body, one under
// the other, and the other rows' dialogs showed an empty body. A List view draws its widget once per row, all under the
// widget's id, and the dialogs share the library's popup layer, where a body reaches its dialog through a named slot.
// The pack's dialogs, the inline SDK, the host's usePackHost and its renderer are the real ones; only module and CSS
// loading is replaced. Each row's instance sits in its row's context path, as the List view's row container gives it.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

const RowDialog = ({ name, letter, actions }) => {
  const { host, popupSlotNames } = usePackHost(
    {
      id: 'dialog1',
      width: 200,
      height: 40,
      currentLayout: 'desktop',
      darkMode: false,
      setExposedVariable: () => {},
      fireEvent: () => {},
    },
    {}
  );
  return (
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-row-dialogs"
      componentName={name}
      componentProps={{}}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={actions}
      host={host}
      popupSlotNames={popupSlotNames}
      renderPopupSlot={() => <p>body of {letter}</p>}
      dataCy={`row-${letter}`}
    />
  );
};

const mountRows = async (name) => {
  loadLibraryModule.mockResolvedValue(pack);
  const rows = ['A', 'B', 'C'].map((letter) => ({ letter, actions: new Map() }));
  render(
    <>
      {rows.map(({ letter, actions }, index) => (
        <SubcontainerContext.Provider key={letter} value={{ contextPath: [{ containerId: 'list1', index }] }}>
          <RowDialog name={name} letter={letter} actions={actions} />
        </SubcontainerContext.Provider>
      ))}
    </>
  );
  await waitFor(() => expect(rows.every(({ actions }) => actions.has('show'))).toBe(true));
  return rows;
};

// What each open dialog's body shows: the elements its slot takes.
const openBodies = () =>
  [...document.querySelectorAll('.tj-cc-popup-host')]
    .flatMap((layer) => [...layer.shadowRoot.querySelectorAll('[data-tj-modal="open"]')])
    .map((dialog) =>
      [...dialog.querySelectorAll('slot')]
        .flatMap((slot) => slot.assignedElements({ flatten: true }))
        .map((element) => element.textContent)
    );

describe.each(['Modal', 'Drawer'])('Ant Design %s in each row of a List view', (name) => {
  test(`[PackComponent-ROWPOPUP-001] each row's ${name} shows its own row's body`, async () => {
    const rows = await mountRows(name);

    for (const { letter, actions } of rows) {
      act(() => {
        actions.get('show')();
      });
      await waitFor(() => expect(openBodies()).toEqual([[`body of ${letter}`]]));
      act(() => {
        actions.get('hide')();
      });
      await waitFor(() => expect(openBodies()).toEqual([]));
    }
  });
});
