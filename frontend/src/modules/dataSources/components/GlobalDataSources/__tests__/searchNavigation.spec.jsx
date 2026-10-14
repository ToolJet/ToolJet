import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { GlobalDataSources } from '..';
import { GlobalDataSourcesContext } from '../../../pages/GlobalDataSourcesPage';
import { BreadCrumbContext } from '@/App';
import { MarketplacePlugins } from '@/MarketplacePage/MarketplacePlugins';
import { pluginsService, marketplaceService, globalDatasourceService } from '@/_services';

jest.mock('../../../pages/GlobalDataSourcesPage', () => ({
  GlobalDataSourcesContext: require('react').createContext({}),
}));
jest.mock('@/App', () => ({ BreadCrumbContext: require('react').createContext({}) }));
jest.mock('../../Sidebar', () => ({ Sidebar: () => null }));
jest.mock('../../DataSourceManager/DataSourceManager', () => ({ DataSourceManager: () => null }));
jest.mock('../../SegregatedList', () => ({ SegregatedList: () => null }));
jest.mock('../../MarketplaceBanner', () => ({ MarketplaceBanner: () => null }));
jest.mock('@/modules/common/components/DataSourceComponents', () => ({
  DataBaseSources: [],
  ApiSources: [],
  CloudStorageSources: [],
  AiSources: [],
  getCommonlyUsedDataSources: () => [],
}));
jest.mock('@/_services', () => ({
  pluginsService: { findAll: jest.fn() },
  marketplaceService: { findAll: jest.fn() },
  globalDatasourceService: { create: jest.fn() },
  authenticationService: { currentSessionValue: {} },
}));
jest.mock('@/_ui/Card', () => ({ Card: ({ title }) => <div>{title}</div> }));
jest.mock('@/MarketplacePage/MarketplaceCard', () => ({ MarketplaceCard: ({ name }) => <div>{name}</div> }));
jest.mock('@/_components', () => ({
  SearchBox: ({ initialValue, callBack }) => <input aria-label="Search" value={initialValue} onChange={callBack} />,
}));
jest.mock('@/_ui/AppButton/AppButton', () => ({ ButtonSolid: () => null }));
jest.mock('@/_ui/Icon/SolidIcons', () => () => null);
jest.mock('@/_components/ToolTip', () => ({ ToolTip: ({ children }) => children }));
jest.mock('@/_helpers', () => ({ canCreateDataSource: () => true }));
jest.mock('@white-label/whiteLabelling', () => ({ fetchAndSetWindowTitle: jest.fn(), pageTitles: {} }));
jest.mock('@/_ui/FolderSkeleton/HeaderSkeleton', () => () => null);
jest.mock('@/_stores/appDataStore', () => ({ useAppDataStore: () => ({}) }));
jest.mock('@/_helpers/utils', () => ({ checkIfToolJetCloud: () => false }));
jest.mock('@/modules/common/helpers/utils', () => ({ fetchEdition: () => 'ee' }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s) => s }) }));

function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('?search=Queue')}>Find queue</button>;
}
function mount(child) {
  return render(
    <MemoryRouter initialEntries={['/?search=Ledger']}>
      <BreadCrumbContext.Provider value={{ updateSidebarNAV: jest.fn() }}>
        <GlobalDataSourcesContext.Provider value={{ activeDatasourceList: '#databases' }}>
          <Navigation />
          {child}
        </GlobalDataSourcesContext.Provider>
      </BreadCrumbContext.Provider>
    </MemoryRouter>
  );
}
const sources = [
  { id: 'ledger', kind: 'ledger', name: 'Ledger', tags: [] },
  { id: 'queue', kind: 'queue', name: 'Queue', tags: [] },
];

beforeEach(() => {
  marketplaceService.findAll.mockResolvedValue({ data: sources });
  pluginsService.findAll.mockResolvedValue({ data: [] });
});

test('URL search includes asynchronously loaded plugins and follows navigation', async () => {
  let loaded;
  pluginsService.findAll.mockReturnValue(
    new Promise((resolve) => {
      loaded = resolve;
    })
  );
  mount(<GlobalDataSources updateSelectedDatasource={jest.fn()} />);
  await act(async () => loaded({ data: sources }));
  expect(await screen.findByText('Ledger')).toBeInTheDocument();
  expect(screen.queryByText('Queue')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Find queue'));
  expect(await screen.findByText('Queue')).toBeInTheDocument();
  expect(screen.queryByText('Ledger')).not.toBeInTheDocument();
  expect(globalDatasourceService.create).not.toHaveBeenCalled();
});

test('marketplace search follows navigation without remounting', async () => {
  mount(<MarketplacePlugins />);
  expect(await screen.findByText('Ledger')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Find queue'));
  expect(await screen.findByText('Queue')).toBeInTheDocument();
  expect(screen.queryByText('Ledger')).not.toBeInTheDocument();
});
