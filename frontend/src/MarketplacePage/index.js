import React from 'react';
import { Header } from '@/_components';
import { ListGroupItem } from './ListGroupItem';
import { InstalledPlugins } from './InstalledPlugins';
import { MarketplacePlugins } from './MarketplacePlugins';

const MarketplacePage = ({ darkMode, switchDarkMode }) => {
  const [active, setActive] = React.useState('installed');

  return (
    <div className="wrapper">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      <div className="page-wrapper">
        <div className="container-xl">
          <div className="page-header d-print-none">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title">Marketplace</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="container-xl">
            <div className="row g-4">
              <div className="col-3">
                <div className="subheader mb-2">Plugins</div>
                <div className="list-group list-group-transparent mb-3">
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
                <InstalledPlugins isActive={active === 'installed'} darkMode={darkMode} />
              ) : (
                <MarketplacePlugins isActive={active === 'marketplace'} darkMode={darkMode} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MarketplacePage };
