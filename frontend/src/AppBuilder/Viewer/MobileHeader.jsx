import React, { useState } from 'react';
import _ from 'lodash';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import classNames from 'classnames';
import MobileNavigationMenu from './MobileNavigationMenu';
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';
import OverflowTooltip from '@/_components/OverflowTooltip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

const MobileHeader = ({ appName, changeToDarkMode, darkMode, currentPageId, switchPage, pages, viewerWrapperRef }) => {
  const { moduleId } = useModuleContext();
  const showDarkModeToggle = useStore((state) => state.globalSettings.appMode === 'auto');
  const pageSettings = useStore((state) => state.pageSettings);
  const { definition: { styles = {}, properties = {} } = {} } = pageSettings ?? {};
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const { showOnMobile, name, hideLogo, hideHeader } = properties ?? {};
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const hasAppPagesHeaderAndLogoEnabled = useStore(
    (state) => state.license?.featureAccess?.appPagesHeaderAndLogoEnabled
  );

  const headerHidden = hasAppPagesHeaderAndLogoEnabled ? hideHeader : false;
  const logoHidden = hasAppPagesHeaderAndLogoEnabled ? hideLogo : false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const switchToHomePage = () => {
    if (currentPageId === homePageId) return;

    const page = pages.find((p) => p.id === homePageId);

    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };

    switchPage(page?.id, pages.find((p) => page.id === p?.id)?.handle, Object.entries(queryParams));
  };

  const _renderAppNameAndLogo = () => (
    <div className="w-100 tw-min-w-0 tw-shrink tw-px-[7px]">
      <h1 className={classNames('navbar-brand', 'd-flex align-items-center justify-content-center tw-gap-[12px] p-0')}>
        {!logoHidden && (
          <div data-cy="viewer-page-logo" onClick={switchToHomePage} className="cursor-pointer tw-flex-shrink-0">
            <AppLogo height={32} isLoadingFromHeader={false} viewer={true} />
          </div>
        )}
        {!headerHidden && (
          <OverflowTooltip childrenClassName="app-title">{name?.trim() ? name : appName}</OverflowTooltip>
        )}
      </h1>
    </div>
  );

  const bgStyles = {
    '--nav-menu-bg': !styles?.backgroundColor?.isDefault
      ? styles?.backgroundColor?.value
      : 'var(--cc-surface1-surface, #FFFFFF)',
    '--nav-menu-border': !styles?.borderColor?.isDefault
      ? styles?.borderColor?.value
      : 'var(--cc-weak-border, #E4E7EB)',
  };

  const _renderMobileNavigationMenu = () => (
    <MobileNavigationMenu
      currentPageId={currentPageId}
      switchPage={switchPage}
      switchToHomePage={switchToHomePage}
      darkMode={darkMode}
      changeToDarkMode={changeToDarkMode}
      showDarkModeToggle={showDarkModeToggle}
      appName={appName}
      pages={pages}
      viewerWrapperRef={viewerWrapperRef}
      bgStyles={bgStyles}
    />
  );

  const MenuBtn = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="icon-btn tw-flex-shrink-0" onClick={toggleSidebar}>
        <SolidIcon width="16px" fill="var(--icon-strong)" name="menu" />
      </div>
    );
  };

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      isMobile={true}
      sidebarWidth="290px"
      className="!tw-min-h-0 !tw-block"
      style={bgStyles}
    >
      {(!isPagesSidebarHidden || !headerHidden || !logoHidden) && (
        <Header className={'mobile-nav-container'}>
          {!isPagesSidebarHidden && showOnMobile && <MenuBtn />}
          {_renderAppNameAndLogo()}
        </Header>
      )}
      {_renderMobileNavigationMenu()}
    </SidebarProvider>
  );
};

export default MobileHeader;
