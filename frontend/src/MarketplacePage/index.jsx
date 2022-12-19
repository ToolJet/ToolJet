import React from 'react';
import Layout from '@/_ui/Layout';
import { ListGroupItem } from './ListGroupItem';
import { InstalledPlugins } from './InstalledPlugins';
import { MarketplacePlugins } from './MarketplacePlugins';

const MarketplacePage = ({ darkMode, switchDarkMode }) => {
  const [active, setActive] = React.useState('installed');

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
                  <InstalledPlugins isActive={active === 'installed'} darkMode={darkMode} />
                ) : (
                  <MarketplacePlugins isActive={active === 'marketplace'} darkMode={darkMode} />
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
