import React from 'react';
import { render, waitFor, within } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// Chrome's accessibility tree: Ant's RadioGroup and Segmented read as a radiogroup named by their label, but Ant's Rate
// read as a list named 'Rating' with its star radios in no radiogroup, and MUI's RadioGroup as an unnamed radiogroup
// (its label named only the fieldset around it). A screen reader announces a radio's group by the radiogroup's name.
// The pack components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  antd: require('../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

afterEach(() => {
  document.body.innerHTML = '';
});

let mounts = 0;
const mount = async (pack, name, props = {}) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  mounts += 1;
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${pack}.js`}
      cssUrl={`${pack}.css`}
      cacheKey={`radio-names-${pack}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`names-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="names-${mounts}"]`).shadowRoot;
  await waitFor(() =>
    expect(root()?.querySelectorAll('[role="radio"], input[type="radio"]').length).toBeGreaterThan(0)
  );
  return within(root());
};

const OPTIONS = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
];

describe('pack radio groups are named by their label', () => {
  test('[PackComponent-A11Y-001] Ant Rate: its stars are radios in a radiogroup named Rating', async () => {
    const tree = await mount('antd', 'Rate');
    const group = tree.getByRole('radiogroup', { name: 'Rating' });
    expect(within(group).getAllByRole('radio')).toHaveLength(5);
  });

  test('[PackComponent-A11Y-002] MUI RadioGroup: the radiogroup itself is named Plan, not only its fieldset', async () => {
    const tree = await mount('mui', 'RadioGroup', { options: OPTIONS });
    const group = tree.getByRole('radiogroup', { name: 'Plan' });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
  });

  test('[PackComponent-A11Y-003] Ant RadioGroup: a radiogroup named Shipping (already so)', async () => {
    const tree = await mount('antd', 'RadioGroup', { options: OPTIONS });
    expect(within(tree.getByRole('radiogroup', { name: 'Shipping' })).getAllByRole('radio')).toHaveLength(2);
  });

  test('[PackComponent-A11Y-004] Ant Segmented: a radiogroup named View (already so)', async () => {
    const tree = await mount('antd', 'Segmented');
    expect(within(tree.getByRole('radiogroup', { name: 'View' })).getAllByRole('radio')).toHaveLength(3);
  });
});
