import '@/test/setupMsw';
import React from 'react';
import { render } from '@/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import config from 'config';
import useStore from '@/AppBuilder/_stores/store';
import { fetchEdition } from '@/modules/common/helpers/utils';
import QueryLibraryPage from '../../QueryLibraryPage';
import { authenticationService } from '@/_services';
import QueryPanel from '@/AppBuilder/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { viewedLibraryVersionId } from '@/AppBuilder/_stores/slices/queryLibrarySlice';

jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));

it('selects the feature state by edition and leaves safe defaults for ordinary queries', () => {
  const state = useStore.getState();
  expect(state.queryLibrary.isLibraryMode).toBe(false);
  expect(state.queryLibrary.sessionId).toBe(0);
  expect(() => viewedLibraryVersionId({ queryLibrary: {} }, 'missing')).not.toThrow();
  if (fetchEdition() === 'ce') {
    expect(state.queryLibrary.beginLibrarySession).toBeUndefined();
    expect(state.queryPanel.runLibraryQuery).toBeDefined();
  } else {
    expect(state.queryLibrary.beginLibrarySession).toEqual(expect.any(Function));
  }
});

it('does not start the editor or issue feature requests in CE', async () => {
  if (fetchEdition() !== 'ce') return;
  const requests = [];
  authenticationService.updateCurrentSession({
    current_organization_id: 'workspace-a',
    load_app: true,
    group_permissions: [],
  });
  server.use(
    http.get(`${config.apiUrl}/*`, ({ request }) => {
      requests.push(new URL(request.url).pathname);
      return HttpResponse.json([]);
    })
  );
  const view = render(<QueryLibraryPage darkMode={false} />);
  expect(view.container.querySelector('[data-cy="query-library-page"]')).toBeNull();
  expect(requests).toHaveLength(0);
  expect(useStore.getState().queryLibrary.isLibraryMode).toBe(false);
});

it('renders an ordinary query panel safely in CE', () => {
  if (fetchEdition() !== 'ce') return;
  const controls = createAppBuilderControls();
  controls.observers.install();
  controls.geometry.textRange();
  try {
    expect(() =>
      render(
        <ModuleProvider moduleId="canvas">
          <QueryPanel darkMode={false} />
        </ModuleProvider>
      )
    ).not.toThrow();
    expect(document.querySelector('[data-cy="restapi-add-query-card"]')).toBeInTheDocument();
  } finally {
    controls.restore();
  }
});
