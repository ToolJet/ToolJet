import React, { useState } from 'react';
import _, { isEmpty } from 'lodash';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import classNames from 'classnames';
import PreviewSettings from './PreviewSettings';
import MobileNavigationMenu from './MobileNavigationMenu';
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';
import OverflowTooltip from '@/_components/OverflowTooltip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

const MobileHeader = ({
  showHeader,
  appName,
  changeToDarkMode,
  darkMode,
  currentPageId,
  switchPage,
  setAppDefinitionFromVersion,
  pages,
  viewerWrapperRef,
}) => {
  const location = useLocation();
  const { moduleId } = useModuleContext();
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );

  // Check if we're in preview mode (has env or version query params)
  const searchParams = new URLSearchParams(location.search);
  const isPreviewMode = searchParams.has('env') || searchParams.has('version');

  // Don't render header at all if not in preview mode
  if (!isPreviewMode) {
    return null;
  }

  const editingVersion = useStore((state) => state.editingVersion);
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
    <div
      className="w-100 tw-min-w-0 tw-shrink tw-px-[7px]"
      style={{ visibility: showHeader || isReleasedVersionId ? 'visible' : 'hidden' }}
    >
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

  const _renderPreviewSettings = () => (
    <PreviewSettings
      isMobileLayout
      showHeader={showHeader}
      setAppDefinitionFromVersion={setAppDefinitionFromVersion}
      darkMode={darkMode}
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
      {!isEmpty(editingVersion) && <Header className={'preview-settings-mobile'}>{_renderPreviewSettings()}</Header>}
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
