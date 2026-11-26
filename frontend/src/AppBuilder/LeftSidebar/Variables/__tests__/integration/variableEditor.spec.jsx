import React from 'react';
import { screen, within, waitFor } from '@testing-library/react';
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { CreateVariableForm, EditVariableForm } from '../../VariableEditor';
import { definitionsOf } from '@/AppBuilder/_utils/variableDefinitions';

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

// The panel passes the store's live definitions. Creating writes the new variable to the store
// before the panel leaves the form, so the form must not then report its own name as a duplicate.
const LiveCreateForm = ({ onCreated }) => {
  const appMap = _useStore((state) => state.globalSettings?.variables);
  const definitions = React.useMemo(() => definitionsOf(appMap, 'app'), [appMap]);
  return (
    <CreateVariableForm
      moduleId="canvas"
      pageName="Home"
      definitions={definitions}
      initialScope="app"
      onCreated={onCreated}
    />
  );
};

test('creating does not flash a duplicate-name error for the variable just created', async () => {
  const session = await setup();
  const created = [];
  session.render(<LiveCreateForm onCreated={(scope, name) => created.push(`${scope}:${name}`)} />);
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'threshold');
  await session.user.click(screen.getByRole('button', { name: 'Create variable' }));

  await waitFor(() => expect(created).toEqual(['app:threshold']));
  expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
});

test('a real duplicate is still reported before creating', async () => {
  const session = await setup();
  await session.store.act((state) =>
    state.setGlobalSettings({ ...state.globalSettings, variables: { threshold: { value: '1', fxActive: false } } })
  );
  session.render(<LiveCreateForm onCreated={() => {}} />);
  await session.user.type(screen.getByPlaceholderText('e.g. selectedOrderId'), 'threshold');

  expect(screen.getByText(/already exists/)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create variable' })).toBeDisabled();
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

test('the initial value is a plain code field with no fx toggle', async () => {
  const session = await setup();
  const { container } = session.render(
    <CreateVariableForm moduleId="canvas" pageName="Home" definitions={[]} initialScope="app" onCreated={() => {}} />
  );

  expect(container.querySelector('[data-cy="variable-initial-value-fx-button"]')).toBeNull();
});

test.each([
  ['{{{test:asdasd"asdasdada"}}}', 'Unexpected string'],
  ['{{notDefinedAnywhere}}', 'notDefinedAnywhere is not defined'],
])('an expression that cannot be evaluated (%s) shows why', async (text, message) => {
  const session = await setup();
  const { container } = session.render(
    <CreateVariableForm moduleId="canvas" pageName="Home" definitions={[]} initialScope="app" onCreated={() => {}} />
  );
  const editor = within(container.querySelector('[data-cy="variable-initial-value"]')).getByRole('textbox');
  await session.user.click(editor);
  await session.user.paste(text);

  const error = container.querySelector('[data-cy="variable-value-evaluation-error"]');
  expect(error).toHaveTextContent('Can’t evaluate');
  expect(error).toHaveTextContent(message);
  expect(container.querySelector('[data-cy="variable-value-preview"]')).toBeNull();
});

test('a saved expression that cannot be evaluated shows why in the detail view', async () => {
  const session = await setup();
  await session.store.act('saveVariableDefinition', { scope: 'app', name: 'broken', value: '{{missingThing.value}}' });
  const definition = session.store.read((state) => state.getAppVariableDefinitions()[0]);
  const { container } = session.render(
    <EditVariableForm
      moduleId="canvas"
      pageName="Home"
      definitions={[definition]}
      row={{ key: 'app:broken', scope: 'app', name: 'broken', definition }}
      onRenamed={() => {}}
    />
  );

  expect(container.querySelector('[data-cy="variable-value-evaluation-error"]')).toHaveTextContent(
    'missingThing is not defined'
  );
});

test('a value saved with the old fx toggle and no braces is shown as {{ }}', async () => {
  const session = await setup();
  await session.store.act('saveVariableDefinition', { scope: 'app', name: 'doubled', value: '5 * 2', fxActive: true });
  const definition = session.store.read((state) => state.getAppVariableDefinitions()[0]);
  const { container } = session.render(
    <EditVariableForm
      moduleId="canvas"
      pageName="Home"
      definitions={[definition]}
      row={{ key: 'app:doubled', scope: 'app', name: 'doubled', definition }}
      onRenamed={() => {}}
    />
  );

  expect(within(container.querySelector('[data-cy="variable-initial-value"]')).getByRole('textbox')).toHaveTextContent(
    '{{5 * 2}}'
  );
  expect(container.querySelector('[data-cy="variable-value-preview"]')).toHaveTextContent('10');
});
