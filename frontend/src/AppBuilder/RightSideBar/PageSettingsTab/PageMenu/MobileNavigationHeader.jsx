import React, { useState } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import classNames from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import MobileNavigationMenu from './MobileNavigationMenu';
import Header from '@/AppBuilder/Viewer/Header';
import OverflowTooltip from '@/_components/OverflowTooltip';
import AppLogo from '@/_components/AppLogo';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const MobileNavigationHeader = ({ isMobileDevice, currentPageId, darkMode, canvasMaxWidth, switchDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { moduleId } = useModuleContext();

  const hasAppPagesHeaderAndLogoEnabled = useStore(
    (state) => state.license?.featureAccess?.appPagesHeaderAndLogoEnabled
  );
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const switchToHomePage = useStore((state) => state.switchToHomePage);

  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const { name, hideLogo, hideHeader } = properties ?? {};

  const headerHidden = hasAppPagesHeaderAndLogoEnabled ? hideHeader : false;
  const logoHidden = hasAppPagesHeaderAndLogoEnabled ? hideLogo : false;

  const _renderAppNameAndLogo = () => (
    <div className="w-100 tw-min-w-0 tw-shrink tw-px-[7px]">
      <h1 className={classNames('navbar-brand', 'd-flex align-items-center justify-content-center tw-gap-[12px] p-0')}>
        {!logoHidden && (
          <div
            data-cy="viewer-page-logo"
            onClick={() => switchToHomePage(currentPageId, moduleId)}
            className="cursor-pointer tw-flex-shrink-0"
          >
            <AppLogo height={32} isLoadingFromHeader={false} viewer={true} />
          </div>
        )}
        {!headerHidden && (
          <OverflowTooltip childrenClassName="app-title">{name?.trim() ? name : appName}</OverflowTooltip>
        )}
      </h1>
    </div>
  );

  const MenuBtn = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="icon-btn tw-flex-shrink-0" onClick={toggleSidebar}>
        <SolidIcon width="16px" fill="var(--icon-strong)" name="menu" />
      </div>
    );
  };

  const bgStyles = {
    maxWidth: canvasMaxWidth,
    '--nav-menu-bg': !styles?.backgroundColor?.isDefault
      ? styles?.backgroundColor?.value
      : 'var(--cc-surface1-surface, #FFFFFF)',
    '--nav-menu-border': !styles?.borderColor?.isDefault
      ? styles?.borderColor?.value
      : 'var(--cc-weak-border, #E4E7EB)',
  };

  if ((isPagesSidebarHidden && headerHidden && logoHidden) || !isMobileDevice) {
    return null;
  }

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      isMobile={true}
      sidebarWidth="290px"
      className="!tw-min-h-0 !tw-block"
      style={{
        flexShrink: 0,
        ...bgStyles,
      }}
    >
      <Header className={'mobile-nav-container'}>
        {!isPagesSidebarHidden && <MenuBtn />}
        {_renderAppNameAndLogo()}
      </Header>
      {!isPagesSidebarHidden && (
        <MobileNavigationMenu
          currentPageId={currentPageId}
          darkMode={darkMode}
          switchDarkMode={switchDarkMode}
          bgStyles={bgStyles}
          headerHidden={headerHidden}
          logoHidden={logoHidden}
        />
      )}
    </SidebarProvider>
  );
};

export default MobileNavigationHeader;
