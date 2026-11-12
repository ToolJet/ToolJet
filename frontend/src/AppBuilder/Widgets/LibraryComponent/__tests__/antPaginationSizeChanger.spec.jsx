import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-06: an Ant Design Pagination with Show size changer on (Total 200, a 40px-high box) opened its page-size list
// inside the widget, which clipped it: only 100 / page could be picked. Ant's Pagination gives that Select the
// trigger's parent as its popup container. The pack's Pagination, the inline SDK and the host renderer (the widget's
// shadow root and the popup layer) are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-pagination-sizes"
      componentName="Pagination"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('Pagination', {})}
      dataCy="pagination"
    />
  );
  const shadow = () => view.container.querySelector('[data-cy="pagination"]').shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.ant-pagination-options .ant-select-selector')).toBeTruthy());
  const layerLists = () =>
    [...document.querySelectorAll('.tj-cc-popup-host')].flatMap((layer) => [
      ...layer.shadowRoot.querySelectorAll('.ant-select-dropdown'),
    ]);
  return { shadow, layerLists, exposed };
};

describe('Ant Design Pagination: the page-size list', () => {
  test('[PackComponent-PAGINATION-001] opens in the popup layer, outside the widget, and takes a pick', async () => {
    const pagination = await mount({ showSizeChanger: true, total: 200 });

    act(() => {
      fireEvent.mouseDown(pagination.shadow().querySelector('.ant-pagination-options .ant-select-selector'));
    });

    await waitFor(() => expect(pagination.layerLists()).toHaveLength(1));
    expect(pagination.shadow().querySelectorAll('.ant-select-dropdown')).toHaveLength(0);
    const [list] = pagination.layerLists();
    const options = [...list.querySelectorAll('.ant-select-item-option')];
    expect(options.map((option) => option.textContent)).toEqual(['10 / page', '20 / page', '50 / page', '100 / page']);

    act(() => {
      fireEvent.click(options[2]);
    });
    expect(pagination.exposed.pageSize).toBe(50);
  });
});
