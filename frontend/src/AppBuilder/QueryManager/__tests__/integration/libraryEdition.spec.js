import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VirtuosoMockContext } from 'react-virtuoso';
import config from 'config';
import { isQueryLibraryEnabled } from '@/AppBuilder/QueryLibrary/queryLibraryApp';
import DataSourcePicker from '../../Components/DataSourcePicker';
import DataSourceSelect from '../../Components/DataSourceSelect';
import { isQueryRunnable } from '@/_helpers/utils';

// fetchEdition() reads config.TOOLJET_EDITION on every call, so flipping it flips the edition.
const originalEdition = config.TOOLJET_EDITION;
afterAll(() => {
  config.TOOLJET_EDITION = originalEdition;
});

const sources = [
  { id: 's1', kind: 'restapi', name: 'restapidefault', type: 'static' },
  { id: 's2', kind: 'library', name: 'librarydefault', type: 'static' },
];
beforeEach(async () => {
  useStore.setState({ license: { featureAccess: { queryLibraryEnabled: true } } });
  server.use(
    http.get(`${config.apiUrl}/data-sources/workspace/environments/development/versions/version`, () =>
      HttpResponse.json({ data_sources: sources })
    )
  );
  await new Promise((resolve) =>
    useStore.getState().fetchGlobalDataSources('workspace', 'version', 'development', { onSuccess: resolve })
  );
});

const wrap = (ui) =>
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 32 }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </VirtuosoMockContext.Provider>
  );

describe.each([
  ['ce', false],
  ['ee', true],
  ['cloud', true],
])('Query library entry in %s', (edition, shown) => {
  beforeEach(() => {
    config.TOOLJET_EDITION = edition;
  });

  it('isQueryLibraryEnabled', () => {
    expect(isQueryLibraryEnabled({ queryLibraryEnabled: true })).toBe(shown);
  });

  it('data source picker (empty query panel)', () => {
    wrap(<DataSourcePicker darkMode={false} />);
    expect(!!document.querySelector('[data-cy="library-add-query-card"]')).toBe(shown);
    // other static sources are untouched
    expect(document.querySelector('[data-cy="restapi-add-query-card"]')).toBeInTheDocument();
  });

  it('data source select popup', () => {
    wrap(<DataSourceSelect closePopup={jest.fn()} />);
    expect(!!document.querySelector('[data-cy="ds-librarydefault"]')).toBe(shown);
    expect(document.querySelector('[data-cy="ds-restapidefault"]')).toBeInTheDocument();
  });
});

describe('already-saved library queries in CE', () => {
  it('still count as runnable (the kind stays declared)', () => {
    config.TOOLJET_EDITION = 'ce';
    expect(isQueryRunnable({ kind: 'library' })).toBe(true);
  });
});

it('removes discovery reactively when effective access is revoked', () => {
  config.TOOLJET_EDITION = 'ee';
  const view = wrap(<DataSourcePicker darkMode={false} />);
  expect(document.querySelector('[data-cy="library-add-query-card"]')).toBeInTheDocument();
  useStore.setState({ license: { featureAccess: { queryLibraryEnabled: false } } });
  view.rerender(
    <MemoryRouter>
      <DataSourcePicker darkMode={false} />
    </MemoryRouter>
  );
  expect(document.querySelector('[data-cy="library-add-query-card"]')).toBeNull();
  expect(document.querySelector('[data-cy="restapi-add-query-card"]')).toBeInTheDocument();
});
