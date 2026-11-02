/**
 * ToolJet Database's SQL mode labels its SQL box "Code", with the open-in-new-tab button at its right, and
 * drops the "pop out code editor" popup, as RunJS, RunPython and the SQL data sources do.
 */
import '@/test/setupMsw';
import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import ToolJetDbOperations from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/ToolJetDbOperations';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { buildQuery } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

// Icon adapter only (external package): the shared lucide mock crashes any ui/Button with an icon.
jest.mock('lucide-react/dynamic.mjs', () => ({ __esModule: true, DynamicIcon: () => null, iconNames: [] }));

const controls = createAppBuilderControls();
const sqlOptions = { activeTab: 'SQL mode', operation: 'sql_execution', sql_execution: { sqlQuery: 'SELECT 1' } };

beforeEach(() => {
  controls.observers.install();
  server.use(
    http.get('http://localhost:3000/api/tooljet-db/organizations/:organizationId/tables', () =>
      HttpResponse.json({ result: [] })
    )
  );
  act(() => {
    useStore.setState((state) => {
      state.dataQuery.queries.modules.canvas = [
        buildQuery({ id: 'q-tjdb', name: 'tjdbQuery', kind: 'tooljetdb', options: sqlOptions }),
      ];
    });
    useStore.getState().queryPanel.setSelectedQuery('q-tjdb');
  });
});
afterEach(() => controls.restore());

test('labels the SQL box "Code" with the open-in-new-tab button, without a popup editor', async () => {
  const { container } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <ToolJetDbOperations options={sqlOptions} optionchanged={() => {}} optionsChanged={() => {}} />
    </ModuleProvider>
  );
  await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument());

  const label = screen.getByText('Code');
  expect(label.parentElement).toContainElement(document.querySelector('[data-cy="query-open-code-editor-tab"]'));
  expect(label.parentElement.nextElementSibling).toContainElement(container.querySelector('.cm-editor'));
  expect(container.querySelector('.codehinter-popup-icon')).toBeNull();
});
