/**
 * A query row reads as one click target: hovering its name shows the same hand cursor as the rest of
 * the row. Only the selected row's name shows the text cursor, since that's the one you rename
 * (double-click).
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryCard } from '@/AppBuilder/QueryPanel/QueryCard';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { buildQuery } from '@/test/app-builder';
import { render } from '@/test/test-utils';

const first = buildQuery({ id: 'q1', name: 'firstQuery' });
const second = buildQuery({ id: 'q2', name: 'secondQuery' });

const nameOf = (name) => screen.getByText(name);

beforeEach(() => {
  act(() => {
    useStore.setState((state) => {
      state.dataQuery.queries.modules.canvas = [first, second];
    });
    useStore.getState().queryPanel.setSelectedQuery('q1');
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryCard dataQuery={first} />
      <QueryCard dataQuery={second} />
    </ModuleProvider>
  );
});

test('marks only the selected query name as editable', () => {
  expect(nameOf('firstQuery')).toHaveClass('query-name-editable');
  expect(nameOf('secondQuery')).not.toHaveClass('query-name-editable');

  act(() => useStore.getState().queryPanel.setSelectedQuery('q2'));

  expect(nameOf('firstQuery')).not.toHaveClass('query-name-editable');
  expect(nameOf('secondQuery')).toHaveClass('query-name-editable');
});

test('shows the text cursor only on the editable name', () => {
  const styles = fs.readFileSync(path.join(__dirname, '../../../../_styles/queryManager.scss'), 'utf8');

  expect(styles).toMatch(/\.query-name-editable\s*\{\s*cursor:\s*text;/);
  expect(styles).not.toMatch(/\.query-name \.text-truncate\s*\{\s*cursor:\s*text;/);
});
