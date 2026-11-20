import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { CreateVariableForm, EditVariableForm } from '../../VariableEditor';

let savedRequests;
const scenario = defineAppBuilderScenario({
  id: 'variable-editor-draft',
  name: 'Variable initial-value draft reaches the form before blur',
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
    network: [
      {
        method: 'put',
        url: '*/v2/apps/:appId/versions/:versionId/global_settings',
        json: () => {
          savedRequests += 1;
          return {};
        },
      },
    ],
  },
});

async function setup() {
  savedRequests = 0;
  const session = new AppBuilderTestSession({ scenario });
  await session.store.act((state) => {
    state.initializeDependencySlice('canvas');
    state.setApp({ appId: 'app-1' }, 'canvas');
    state.setCurrentVersionId('version-1');
    state.setGlobalSettings({ ...state.globalSettings, variables: {} });
    state.setPages([{ id: 'page-1', handle: 'home', name: 'Home', components: {}, variables: {} }], 'canvas');
    state.setCurrentPageId('page-1', 'canvas');
    state.setComponentNameIdMapping('canvas');
    state.initDependencyGraph('canvas');
  });
  return session;
}

test.each([
  ['5', 5, 'Number'],
  ['0', 0, 'Number'],
  ['false', false, 'Boolean'],
  ['null', null, 'Null'],
  ['{{5 * 2}}', 10, 'Number'],
])('entered %s updates its preview before blur and is saved on create', async (text, expected, type) => {
  const session = await setup();
  const { container } = session.render(
    <CreateVariableForm moduleId="canvas" pageName="Home" definitions={[]} initialScope="app" onCreated={() => {}} />
  );
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'threshold');
  const editor = within(container.querySelector('[data-cy="variable-initial-value"]')).getByRole('textbox');
  await session.user.click(editor);
  await session.user.paste(text);

  expect(editor).toHaveTextContent(text);
  expect(screen.getByText(type)).toBeVisible();
  expect(container.querySelector('[data-cy="variable-value-preview"]')).toHaveTextContent(String(expected));
  await session.user.click(screen.getByRole('button', { name: 'Create variable' }));

  await waitFor(() => expect(savedRequests).toBe(1));
  expect(session.store.read((state) => state.getAppVariableDefinitions())).toEqual([
    expect.objectContaining({ name: 'threshold', value: text, fxActive: false }),
  ]);
  expect(session.store.read((state) => state.resolvedStore.modules.canvas.exposedValues.variables.threshold)).toBe(
    expected
  );
});

test('an intentionally omitted initial value stays an empty string', async () => {
  const session = await setup();
  session.render(
    <CreateVariableForm moduleId="canvas" pageName="Home" definitions={[]} initialScope="app" onCreated={() => {}} />
  );
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'blank');
  await session.user.click(screen.getByRole('button', { name: 'Create variable' }));

  await waitFor(() => expect(savedRequests).toBe(1));
  expect(session.store.read((state) => state.getAppVariableDefinitions())).toEqual([
    expect.objectContaining({ name: 'blank', value: '' }),
  ]);
  expect(session.store.read((state) => state.resolvedStore.modules.canvas.exposedValues.variables.blank)).toBe('');
});

test('editing applies the value immediately; blur does not save twice or add another undo step', async () => {
  const session = await setup();
  await session.store.act('saveVariableDefinition', { scope: 'app', name: 'threshold', value: '' });
  savedRequests = 0;
  const definition = session.store.read((state) => state.getAppVariableDefinitions()[0]);
  const { container } = session.render(
    <EditVariableForm
      moduleId="canvas"
      pageName="Home"
      definitions={[definition]}
      row={{ key: 'app:threshold', scope: 'app', name: 'threshold', definition }}
      onRenamed={() => {}}
    />
  );
  const editor = within(container.querySelector('[data-cy="variable-initial-value"]')).getByRole('textbox');
  await session.user.click(editor);
  await session.user.paste('8');

  await waitFor(() => expect(savedRequests).toBe(1));
  expect(session.store.read((state) => state.resolvedStore.modules.canvas.exposedValues.variables.threshold)).toBe(8);
  await session.user.click(container.querySelector('[data-cy="variable-name-input"]'));
  expect(savedRequests).toBe(1);

  await session.store.act('handleUndo');
  expect(session.store.read((state) => state.resolvedStore.modules.canvas.exposedValues.variables.threshold)).toBe('');
});
