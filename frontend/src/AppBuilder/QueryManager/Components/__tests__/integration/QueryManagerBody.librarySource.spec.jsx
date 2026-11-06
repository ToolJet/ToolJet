/**
 * Source selector for a library REST draft. Real store; only the kind's code editor and the preview are stubbed.
 */
import React from 'react';
import { render } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { BaseQueryManagerBody } from '../../QueryManagerBody';

// External icon package adapter: the shared lucide stub in __mocks__ can't render icons from this lucide version.
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
// The kind's own editor is a code editor that needs a browser; this suite is about the Source selector above it.
jest.mock('../../../QueryEditors', () => ({ allSources: {}, source: () => null }));
jest.mock('../../Preview', () => ({ __esModule: true, default: () => null }));

const state = () => useStore.getState();
const controls = createAppBuilderControls();
afterEach(() => controls.restore());

beforeEach(() => {
  controls.observers.install();
  useStore.setState((s) => ({ license: { featureAccess: { ...s.license.featureAccess, queryLibraryEnabled: true } } }));
});

function seedLibraryDraft(dataSourceId) {
  state().queryLibrary.beginLibrarySession('workspace-a');
  useStore.setState((s) => ({
    globalDataSources: [{ id: 'rest-2', kind: 'restapi', name: 'Billing API', type: 'default', scope: 'global' }],
    queryLibrary: {
      ...s.queryLibrary,
      versionsByQueryId: {
        q1: {
          drafts: [
            {
              id: 'draft-a',
              name: 'v1',
              kind: 'restapi',
              dataSourceId,
              options: { method: 'get', url: '', headers: [['', '']], url_params: [['', '']], body: [['', '']] },
            },
          ],
          versions: [],
        },
      },
      viewedVersionIdByQueryId: { q1: 'draft-a' },
    },
  }));
  // Catalog list rows carry only these fields; kind/options/source come from the viewed draft.
  state().dataQuery.setQueries(
    [{ id: 'q1', name: 'getCustomers', folderId: null, createdAt: '2026-01-01', updatedAt: '2026-01-02' }],
    'canvas'
  );
  state().queryPanel.setSelectedQuery('q1');
}

// F07: queryPanelSlice.js:155-167 resolves a source-less library restapi draft to defaultSources.restapi, and
// QueryManagerBody.jsx:680 renders renderChangeDataSource() only when data_source_id is set, so no Source selector.
it('offers the Source selector for a library REST draft whose source was deleted', () => {
  seedLibraryDraft(null);
  const { container } = render(<BaseQueryManagerBody darkMode={false} activeTab={1} />);

  expect(container.querySelector('[data-cy="query-manager-change-data-source"]')).toBeInTheDocument();
});
