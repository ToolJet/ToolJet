import React, { useState, Suspense } from 'react';
import _, { isEmpty } from 'lodash';
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import { shallow } from 'zustand/shallow';
import classNames from 'classnames';
import PreviewSettings from './PreviewSettings';
import useStore from '@/AppBuilder/_stores/store';
import AppLogo from '@/_components/AppLogo';
import OverflowTooltip from '@/_components/OverflowTooltip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

// Lazy load MobileNavigationMenu to reduce initial bundle size
const MobileNavigationMenu = React.lazy(() => import('./MobileNavigationMenu'));

const MobileHeader = ({
  showHeader,
  appName,
  changeToDarkMode,
  darkMode,
  currentPageId,
  switchPage,
  setAppDefinitionFromVersion,
  showViewerNavigation,
  pages,
  viewerWrapperRef,
}) => {
  const { moduleId } = useModuleContext();
  const { isReleasedVersionId } = useStore(
    (state) => ({
      isReleasedVersionId: state?.releasedVersionId == state.currentVersionId || state.isVersionReleased,
    }),
    shallow
  );
  const editingVersion = useStore((state) => state.editingVersion);
  const showDarkModeToggle = useStore((state) => state.globalSettings.appMode === 'auto');
  const pageSettings = useStore((state) => state.pageSettings);
  const { definition: { styles = {}, properties = {} } = {} } = pageSettings ?? {};
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const { showOnMobile, name, hideLogo, hideHeader } = properties ?? {};
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const license = useStore((state) => state.license);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch the version parameter from the query string
  const searchParams = new URLSearchParams(window.location.search);
  const version = searchParams.get('version');

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
        {!hideLogo && (
          <div data-cy="viewer-page-logo" onClick={switchToHomePage} className="cursor-pointer tw-flex-shrink-0">
            <AppLogo height={32} isLoadingFromHeader={false} viewer={true} />
          </div>
        )}
        {!hideHeader && (
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
    <Suspense fallback={null}>
      <MobileNavigationMenu
        currentPageId={currentPageId}
        switchPage={switchPage}
        switchToHomePage={switchToHomePage}
        darkMode={darkMode}
        changeToDarkMode={changeToDarkMode}
        showHeader={showHeader}
        showDarkModeToggle={showDarkModeToggle}
        appName={appName}
        pages={pages}
        viewerWrapperRef={viewerWrapperRef}
        bgStyles={bgStyles}
      />
    </Suspense>
  );

  const _renderPreviewSettings = () =>
    !isReleasedVersionId && (
      <PreviewSettings
        isMobileLayout
        showHeader={showHeader}
        setAppDefinitionFromVersion={setAppDefinitionFromVersion}
        darkMode={darkMode}
      />
    );

  // TODO: Check and remove the below code if not being used since showHeader is not being used now
  const _renderDarkModeBtn = (args) => {
    if (!showDarkModeToggle) return null;
    const styles = args?.styles ?? {};
    return (
      <span
        className="released-version-no-header-dark-mode-icon"
        style={{ position: 'absolute', top: '7px', ...styles }}
      >
        <DarkModeToggle switchDarkMode={changeToDarkMode} darkMode={darkMode} />
      </span>
    );
  };

  if (!showHeader && isReleasedVersionId) {
    return <>{showViewerNavigation && showOnMobile ? _renderMobileNavigationMenu() : _renderDarkModeBtn()}</>;
  }

  if (!showHeader && !isReleasedVersionId) {
    return (
      <>
        <Header
          styles={{
            height: '46px',
            position: 'fixed',
            width: version ? '450px' : '100%',
            zIndex: '100',
          }}
          showNavbarClass={false}
        >
          {showViewerNavigation && _renderMobileNavigationMenu()}
          {/* {!isEmpty(editingVersion) && _renderPreviewSettings()} */}
          {!showViewerNavigation && _renderDarkModeBtn()}
        </Header>
      </>
    );
  }
  // TODO: Remove code till here

  const MenuBtn = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="icon-btn tw-flex-shrink-0" onClick={toggleSidebar}>
        <SolidIcon width="16px" fill="var(--icon-strong)" name="menu" />
      </div>
    );
  };

  const isLicensed =
    !_.get(license, 'featureAccess.licenseStatus.isExpired', true) &&
    _.get(license, 'featureAccess.licenseStatus.isLicenseValid', false);

  const headerHidden = isLicensed ? hideHeader : false;
  const logoHidden = isLicensed ? hideLogo : false;

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      isMobile={true}
      sidebarWidth="290px"
      className="!tw-min-h-0 !tw-block"
      style={bgStyles}
    >
      {!isEmpty(editingVersion) && !isReleasedVersionId && (
        <Header className={'preview-settings-mobile'}>{_renderPreviewSettings()}</Header>
      )}
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
