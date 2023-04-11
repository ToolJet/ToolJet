import React from 'react';
import Layout from '@/_ui/Layout';
import { ListGroupItem } from './ListGroupItem';
import { InstalledPlugins } from './InstalledPlugins';
import { MarketplacePlugins } from './MarketplacePlugins';
import { marketplaceService, pluginsService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MarketplacePage = ({ darkMode, switchDarkMode }) => {
  const [active, setActive] = React.useState('installed');
  const [marketplacePlugins, setMarketplacePlugins] = React.useState([]);
  const [installedPlugins, setInstalledPlugins] = React.useState([]);
  const [fetchingInstalledPlugins, setFetching] = React.useState(false);

  const { admin } = authenticationService.currentSessionValue;
  const ENABLE_MARKETPLACE_DEV_MODE = window.public_config?.ENABLE_MARKETPLACE_DEV_MODE == 'true';

  const navigate = useNavigate();

  React.useEffect(() => {
    if (!admin) {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  React.useEffect(() => {
    marketplaceService
      .findAll()
      .then(({ data = [] }) => setMarketplacePlugins(data))
      .catch((error) => {
        toast.error(error?.message || 'something went wrong');
      });

    fetchPlugins();

    () => {
      setMarketplacePlugins([]);
      setInstalledPlugins([]);
    };
  }, [active]);

  const fetchPlugins = async () => {
    setFetching(true);
    const { data, error } = await pluginsService.findAll();
    setFetching(false);

    if (error) {
      toast.error(error?.message || 'something went wrong');
      return;
    }

    setInstalledPlugins(data);
  };

  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div className="wrapper">
        <div className="page-wrapper">
          <div className="page-body">
            <div className="p-3">
              <div className="row g-4">
                <div className="col-3">
                  <div className="subheader mb-2">Plugins</div>
                  <div className="list-group mb-3">
                    <ListGroupItem
                      active={active === 'installed'}
                      handleClick={() => setActive('installed')}
                      text="Installed"
                    />
                    <ListGroupItem
                      active={active === 'marketplace'}
                      handleClick={() => setActive('marketplace')}
                      text="Marketplace"
                    />
                  </div>
                </div>
                {active === 'installed' ? (
                  <InstalledPlugins
                    allPlugins={marketplacePlugins}
                    installedPlugins={installedPlugins}
                    fetching={fetchingInstalledPlugins}
                    fetchPlugins={fetchPlugins}
                    ENABLE_MARKETPLACE_DEV_MODE={ENABLE_MARKETPLACE_DEV_MODE}
                  />
                ) : (
                  <MarketplacePlugins allPlugins={marketplacePlugins} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export { MarketplacePage };
