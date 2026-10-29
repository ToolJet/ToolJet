import '@/test/setupMsw';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import config from 'config';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import LibraryQueryDependencyWarning from '../../LibraryQueryDependencyWarning';

it.each([true, false])(
  'preserves whole-query selection and only warns for a typed dependency conflict (%s)',
  async (dependency) => {
    const query = { id: 'q1', name: 'Customer', kind: 'restapi', options: {} };
    const state = () => useStore.getState();
    state().queryLibrary.beginLibrarySession('workspace-a');
    state().dataQuery.setQueries([query]);
    state().setQueryMapping('canvas');
    state().initialiseResolvedQuery(['q1'], 'canvas');
    state().queryPanel.setSelectedQuery('q1');
    server.use(
      http.delete(`${config.apiUrl}/query-library/queries/q1`, () =>
        HttpResponse.json(
          { code: dependency ? 'LIBRARY_QUERY_IN_USE' : 'OTHER_CONFLICT', message: 'Deletion refused' },
          { status: 409 }
        )
      )
    );
    render(<LibraryQueryDependencyWarning darkMode />);
    await act(async () => state().dataQuery.deleteDataQueries('q1'));
    expect(state().queryPanel.selectedQuery.id).toBe('q1');
    expect(state().dataQuery.queries.modules.canvas.map(({ id }) => id)).toEqual(['q1']);
    expect(state().dataQuery.isDeletingQueryInProcess).toBe(false);
    if (dependency) {
      expect(screen.getByRole('dialog', { name: 'Dependent apps or modules found!' })).toHaveTextContent(
        'Cannot delete this query as it is being used in one or more apps or modules.'
      );
      fireEvent.click(screen.getByRole('button', { name: 'I understand' }));
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }
);
