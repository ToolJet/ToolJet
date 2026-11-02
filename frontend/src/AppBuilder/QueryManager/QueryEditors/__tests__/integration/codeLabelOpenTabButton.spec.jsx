/**
 * The "open code editor in a new tab" button sits next to the RunJS / RunPython "Code" label, not in the
 * query header.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import Runjs from '@/AppBuilder/QueryManager/QueryEditors/Runjs/Runjs';
import { Runpy } from '@/AppBuilder/QueryManager/QueryEditors/Runpy';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { buildQuery } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const queries = [
  buildQuery({ id: 'q-js', name: 'jsQuery', kind: 'runjs' }),
  buildQuery({ id: 'q-py', name: 'pyQuery', kind: 'runpy' }),
];

beforeEach(() => {
  controls.observers.install();
  act(() => {
    useStore.setState((state) => {
      state.dataQuery.queries.modules.canvas = queries;
    });
  });
});
afterEach(() => controls.restore());

test.each([
  ['RunJS', Runjs, 'q-js'],
  ['RunPython', Runpy, 'q-py'],
])('%s shows the open-in-new-tab button next to the Code label', (_, Editor, queryId) => {
  act(() => useStore.getState().queryPanel.setSelectedQuery(queryId));
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <Editor options={{ code: 'return 1' }} optionsChanged={() => {}} />
    </ModuleProvider>
  );

  const label = screen.getByText('Code');
  const button = document.querySelector('[data-cy="query-open-code-editor-tab"]');
  expect(button).toBeInTheDocument();
  expect(label.parentElement).toContainElement(button);
});

test('the query header no longer renders the button', () => {
  const header = fs.readFileSync(path.join(__dirname, '../../../Components/QueryManagerHeader.jsx'), 'utf8');
  expect(header).not.toMatch(/OpenCodeEditorTabButton/);
});
