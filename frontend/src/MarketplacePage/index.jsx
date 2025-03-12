import React, { useContext } from 'react';
import Layout from '@/_ui/Layout';
import { authenticationService } from '@/_services';
import { BreadCrumbContext } from '@/App/App';
import FolderList from '@/_ui/FolderList/FolderList';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const MarketplacePage = ({ darkMode, switchDarkMode }) => {
  const [active, setActive] = React.useState('');
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { admin } = authenticationService.currentSessionValue;

  React.useEffect(() => {
    updateSidebarNAV('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  const marketplaceNavItemList = [
    {
      lable: 'Installed',
      value: 'installed',
    },
    {
      lable: 'Marketplace',
      value: 'marketplace',
    },
  ];

  React.useEffect(() => {
    const currentPath = location.pathname.split('/').pop();
    if (currentPath === 'marketplace' || currentPath === 'Marketplace') {
      setActive('marketplace');
      updateSidebarNAV('Marketplace');
    }
    if (currentPath === 'installed' || currentPath === 'Installed') {
      setActive('installed');
      updateSidebarNAV('Installed');
    }
  }, [location.pathname, setActive, updateSidebarNAV]);

  return (
    <Layout switchDarkMode={switchDarkMode} darkMode={darkMode}>
      <div className="wrapper">
        <div className="marketplace-body">
          <div className="pt-3 px-3">
            <div className="row g-4">
              <div className="marketplace-page-sidebar  mt-3 mx-3">
                <div className="subheader mb-2">Plugins</div>
                <div className="list-group mb-3">
                  {marketplaceNavItemList.map((item, index) => (
                    <FolderList
                      key={index}
                      action
                      selectedItem={active === item.value}
                      onClick={() => navigate(item.value)}
                    >
                      {item.lable}
                    </FolderList>
                  ))}
                </div>
              </div>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export { MarketplacePage };
