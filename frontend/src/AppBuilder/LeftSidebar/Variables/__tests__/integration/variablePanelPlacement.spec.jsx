import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { RightSideBar } from '@/AppBuilder/RightSideBar/RightSideBar';
import VariablesPanel from '../../VariablesPanel';
import useStore from '@/AppBuilder/_stores/store';

const scenario = defineAppBuilderScenario({
  id: 'variables-contextual-panel',
  name: 'Variables list and contextual configuration occupy separate panels',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {
    observers: true,
    geometry: { textRange: true },
    media: { matches: false },
    network: [{ method: 'put', url: '*/v2/apps/:appId/versions/:versionId/:resource', status: 200, json: {} }],
  },
});

const workspace = (withList = true) => (
  <ModuleProvider moduleId="canvas" isModuleMode={false}>
    {withList && <VariablesPanel moduleId="canvas" onClose={() => {}} />}
    <RightSideBar darkMode={false} />
  </ModuleProvider>
);

async function setup(status = 200) {
  const configured = defineAppBuilderScenario({
    ...scenario,
    capabilities: {
      ...scenario.capabilities,
      network: [
        {
          method: 'put',
          url: '*/v2/apps/:appId/versions/:versionId/:resource',
          status,
          json: { message: 'Save rejected' },
        },
      ],
    },
  });
  const session = new AppBuilderTestSession({ scenario: configured });
  expect(useStore.getState().openVariablePanel).toEqual(expect.any(Function));
  await session.store.act((s) => {
    s.initializeDependencySlice('canvas');
    s.setApp({ appId: 'app-1' }, 'canvas');
    s.setCurrentVersionId(`placement-${status}-${Date.now()}`);
    s.setGlobalSettings({ ...s.globalSettings, variables: {} });
    s.setPages(
      [
        {
          id: 'page-1',
          handle: 'home',
          name: 'Home',
          components: {},
          variables: { threshold: { value: '10', fxActive: false } },
        },
        {
          id: 'page-2',
          handle: 'other',
          name: 'Other',
          components: {},
          variables: { threshold: { value: '20', fxActive: false } },
        },
      ],
      'canvas'
    );
    s.setCurrentPageId('page-1', 'canvas');
    s.setComponentNameIdMapping('canvas');
    s.initDependencyGraph('canvas');
    s.setIsEditorFreezed(false);
    s.setRightSidebarOpen(false);
    s.setActiveRightSideBarTab(null);
  });
  await session.store.act('setVariableDefinitionMap', 'app', { source: { value: '5', fxActive: false } });
  await session.store.act('initVariableDefinitions', 'canvas');
  session.render(workspace());
  return session;
}

test('opening a variable keeps its list and search on the left and edits on the right', async () => {
  const session = await setup();
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  const name = await screen.findByDisplayValue('source');
  expect(name.closest('.right-panel-shell')).not.toBeNull();
  const documentation = screen.getByRole('link', { name: 'Variables documentation' });
  expect(documentation).toHaveAttribute('href', 'https://docs.tooljet.com/docs/actions/set-page-variable/');
  expect(documentation).toHaveAttribute('target', '_blank');
  expect(documentation).toHaveAttribute('rel', 'noreferrer');
  expect(screen.getByPlaceholderText('Search variables')).toBeVisible();
  expect(screen.getByRole('button', { name: /^source Number/ })).toBeVisible();
});

test('creation stays on the right, preserves list search and shows the saved details', async () => {
  const session = await setup();
  await session.user.type(screen.getByPlaceholderText('Search variables'), 'source');
  await session.user.click(screen.getByRole('button', { name: 'New variable', exact: true }));
  const name = screen.getByPlaceholderText('e.g. selectedOrderId');
  const documentation = screen.getByRole('link', { name: 'Variables documentation' });
  expect(documentation).toHaveAttribute('href', 'https://docs.tooljet.com/docs/actions/set-page-variable/');
  expect(documentation).toHaveAttribute('target', '_blank');
  expect(documentation).toHaveAttribute('rel', 'noreferrer');
  expect(name.closest('.right-panel-shell')).not.toBeNull();
  await session.user.type(name, 'createdValue');
  await session.user.click(screen.getByRole('button', { name: 'Create variable', exact: true }));
  await screen.findByDisplayValue('createdValue');
  expect(screen.getByPlaceholderText('Search variables')).toHaveValue('source');
});

test('closing configuration leaves the searchable left list open', async () => {
  const session = await setup();
  await session.user.type(screen.getByPlaceholderText('Search variables'), 'source');
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  await session.user.click(screen.getByRole('button', { name: 'Close variable configuration' }));
  expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(false);
  expect(screen.getByPlaceholderText('Search variables')).toHaveValue('source');
});

test('right configuration survives unmounting the left resource list', async () => {
  const session = await setup();
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  session.render(workspace(false));
  expect(await screen.findByDisplayValue('source')).toBeVisible();
});

test('switching pages closes a page editor instead of editing the same name on another page', async () => {
  const session = await setup();
  await session.user.click(screen.getByRole('button', { name: /^threshold Number/ }));
  await screen.findByDisplayValue('threshold');
  expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(true);
  await session.store.act('setCurrentPageId', 'page-2', 'canvas');
  await waitFor(() => expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(false));
  expect(
    session.store.read((s) => s.modules.canvas.pages.find((p) => p.id === 'page-2').variables.threshold.value)
  ).toBe('20');
});

test('switching versions closes the old configuration', async () => {
  const session = await setup();
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  await screen.findByDisplayValue('source');
  expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(true);
  await session.store.act('setCurrentVersionId', 'version-2');
  await waitFor(() => expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(false));
});

test('frozen variable details keep navigation live while mutation fields are disabled', async () => {
  const session = await setup();
  await session.store.act('setIsEditorFreezed', true);
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  const name = await screen.findByDisplayValue('source');
  expect(name).toBeDisabled();
  expect(name.closest('.right-panel-shell')).not.toHaveClass('tw-pointer-events-none');
  expect(screen.getByRole('button', { name: 'Close variable configuration' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Entity actions' })).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Variables documentation' })).toBeVisible();
});

test.each([200, 500])('a rename keeps the right editor open when its save returns %s', async (status) => {
  const session = await setup(status);
  await session.user.click(screen.getByRole('button', { name: /^source Number/ }));
  const name = await screen.findByDisplayValue('source');
  await session.user.clear(name);
  await session.user.type(name, 'renamedSource');
  await session.user.keyboard('{Enter}');
  if (status === 200) {
    await waitFor(() => expect(session.store.read((s) => s.getVariableDefinitions()[0].name)).toBe('renamedSource'));
  } else {
    await screen.findByText('Variable changes could not be saved. Try again.');
    expect(session.store.read((s) => s.getVariableDefinitions()[0].name)).toBe('source');
  }
  expect(session.store.read((s) => s.isRightSidebarOpen)).toBe(true);
  expect(screen.getByDisplayValue('renamedSource').closest('.right-panel-shell')).not.toBeNull();
});
