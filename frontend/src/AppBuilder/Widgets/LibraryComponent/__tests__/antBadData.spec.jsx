import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 40: an Ant Table given rows that are not records ([null, 1, 'x', {}, [], { label: null, children: 'nope' }])
// and an Ant QR Code given a value too long for a QR code drew "Something went wrong" instead of the component. The
// pack's components are the real ones; only module and CSS loading is replaced.
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
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-bad-data"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`ant-bad-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="ant-bad-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return { root: root(), view };
};

const BAD_ROWS = [null, 1, 'x', {}, [], { label: null, children: 'nope' }];

describe('an Ant component given data it cannot draw', () => {
  let errors;
  beforeEach(() => {
    errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => errors.mockRestore());

  it('a Table draws every row, the ones that are not records as values, without crashing', async () => {
    const { root } = await mount('Table', { dataSource: BAD_ROWS, pagination: false });
    await waitFor(() => expect(root.querySelectorAll('tbody tr.ant-table-row')).toHaveLength(BAD_ROWS.length));
    expect(root.textContent).not.toMatch(/Something went wrong/i);
  });

  it('a Table still draws rows whose children are lists of rows as a tree', async () => {
    const tree = [{ id: 1, name: 'Parent', children: [{ id: 2, name: 'Child' }] }];
    const { root } = await mount('Table', { dataSource: tree });
    await waitFor(() => expect(root.querySelector('.ant-table-row-expand-icon')).toBeTruthy());
  });

  it('a QR Code with a value too long for a QR code says so, without crashing', async () => {
    const { root } = await mount('QRCode', { value: 'x'.repeat(10000) });
    await waitFor(() => expect(root.textContent).toContain('Too long for a QR code'));
    expect(root.textContent).not.toMatch(/Something went wrong/i);
  });

  it('a QR Code with the longest value its error level holds still draws it', async () => {
    // 2331 bytes is the most at error level M.
    const { root } = await mount('QRCode', { value: 'x'.repeat(2331), errorLevel: 'M' });
    await waitFor(() => expect(root.querySelector('svg')).toBeTruthy());
    expect(root.textContent).not.toContain('Too long for a QR code');
  });
});
