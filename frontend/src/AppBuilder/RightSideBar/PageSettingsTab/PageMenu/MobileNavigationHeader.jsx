import React, { useState, Suspense } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import classNames from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Header from '@/AppBuilder/Viewer/Header';
import OverflowTooltip from '@/_components/OverflowTooltip';
import AppLogo from '@/_components/AppLogo';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from '../../rightSidebarConstants';
import PageMenuConfigHandle from './PageMenuConfigHandle';

// Lazy load MobileNavigationMenu to reduce initial bundle size
const MobileNavigationMenu = React.lazy(() => import('./MobileNavigationMenu'));

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

  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const activeRightSideBarTab = useStore((state) => state.activeRightSideBarTab);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen, shallow);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
  const shouldShowBlueBorder = currentMode === 'edit' && activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES;

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

  const handleMenuClick = (e) => {
    // Only handle page menu header clicks in edit mode, as there's no right sidebar in view mode
    if (currentMode !== 'edit') return;

    // Check if click is on the navigation area but not hamburger button
    const isNavigationItem = e.target.closest('.icon-btn');

    if (!isNavigationItem) {
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES);
      if (!isRightSidebarOpen) {
        setRightSidebarOpen(true);
      }
    }
  };

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
      <div
        className={`navigation-with-tooltip-wrapper ${shouldShowBlueBorder && 'active'}`}
        style={{ position: 'relative', zIndex: 'auto' }}
      >
        <Header
          className={classNames('mobile-nav-container', { 'navigation-hover-trigger': currentMode === 'edit' })}
          onClick={handleMenuClick}
        >
          {!isPagesSidebarHidden && <MenuBtn />}
          {_renderAppNameAndLogo()}
        </Header>

        {/* Show config handle on hover or when tab is active (only in edit mode, controlled by CSS) */}
        {currentMode === 'edit' && <PageMenuConfigHandle position="top" isMobile />}
      </div>
      {!isPagesSidebarHidden && (
        <Suspense fallback={null}>
          <MobileNavigationMenu
            currentPageId={currentPageId}
            darkMode={darkMode}
            switchDarkMode={switchDarkMode}
            bgStyles={bgStyles}
            headerHidden={headerHidden}
            logoHidden={logoHidden}
          />
        </Suspense>
      )}
    </SidebarProvider>
  );
};

export default MobileNavigationHeader;
