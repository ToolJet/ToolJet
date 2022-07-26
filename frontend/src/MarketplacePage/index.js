import React from 'react';
import cx from 'classnames';
import { pluralize } from '@/_helpers/utils';
import { Header } from '@/_components';
import { Filters } from './Filters';
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
                {/* <div className="text-muted mt-1">{pluralize(0, 'result')}</div> */}
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
                  <a
                    className={cx('list-group-item list-group-item-action d-flex align-items-center', {
                      active: active === 'installed',
                    })}
                    onClick={() => setActive('installed')}
                    href="#"
                  >
                    Installed
                    {/* <small className="text-muted ms-auto">24</small> */}
                  </a>
                  <a
                    className={cx('list-group-item list-group-item-action d-flex align-items-center', {
                      active: active === 'marketplace',
                    })}
                    onClick={() => setActive('marketplace')}
                    href="#"
                  >
                    Marketplace
                    {/* <small className="text-muted ms-auto">149</small> */}
                  </a>
                </div>
                <Filters />
                <div className="mt-3">
                  <a href="#">✨ Write and submit new plugin</a>
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
