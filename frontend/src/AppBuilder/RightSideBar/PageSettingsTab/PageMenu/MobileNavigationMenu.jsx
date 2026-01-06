import React, { useMemo, useState } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from './Tree/utilities';
import * as Icons from '@tabler/icons-react';
import AppLogo from '@/_components/AppLogo';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import {
  SidebarProvider,
  Sidebar as SidebarWrapper,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import toast from 'react-hot-toast';
import { RenderPageAndPageGroup } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/PageGroup';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import classNames from 'classnames';
import Header from '@/AppBuilder/Viewer/Header';

const MobileNavigationMenu = ({
  isMobileDevice,
  switchPage,
  currentPageId,
  darkMode,
  canvasMaxWidth,
  switchDarkMode,
}) => {
  const { moduleId } = useModuleContext();
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile' && currentMode === 'view';
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const isPreviewInEditor = useStore((state) => state.isPreviewInEditor && currentMode === 'view', shallow);
  const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
  const showDarkModeToggle = useStore((state) => state.globalSettings.appMode === 'auto');
  const pages = useStore((state) => state.modules.canvas.pages, shallow);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);

  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);
  const hasAppPagesHeaderAndLogoEnabled = useStore(
    (state) => state.license?.featureAccess?.appPagesHeaderAndLogoEnabled
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);

  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const { name, hideLogo, hideHeader } = properties ?? {};

  const headerHidden = hasAppPagesHeaderAndLogoEnabled ? hideHeader : false;
  const logoHidden = hasAppPagesHeaderAndLogoEnabled ? hideLogo : false;

  const pagesVisibilityState = useStore((state) => state.resolvedStore.modules[moduleId]?.others?.pages || {}, shallow);

  const pagesTree = useMemo(
    () => (hasAppPagesAddNavGroupEnabled ? buildTree(pages) : pages),
    [hasAppPagesAddNavGroupEnabled, pages]
  );

  const mainNavBarPages = useMemo(() => {
    return pagesTree.filter((page) => {
      const pageVisibility = pagesVisibilityState[page?.id]?.hidden ?? false;
      return (
        !page?.restricted &&
        !pageVisibility &&
        !page?.disabled &&
        (!page?.isPageGroup ||
          (page.children?.length > 0 &&
            page.children.some((child) => !child?.disabled) &&
            page.children.some((child) => {
              const pageVisibility = pagesVisibilityState[child?.id]?.hidden ?? false;
              return pageVisibility === false;
            })))
      );
    });
  }, [pagesTree, pagesVisibilityState]);

  // In mobile view both icon and label will always be visible
  const labelStyle = {
    icon: {
      hidden: false,
    },
    label: {
      hidden: false,
    },
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

  const getAbsoluteUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const switchPageWrapper = (page) => {
    if (page?.type === 'url') {
      if (page?.url) {
        const finalUrl = getAbsoluteUrl(page.url);
        if (finalUrl) {
          if (page.openIn === 'new_tab') {
            window.open(finalUrl, '_blank');
          } else {
            window.location.href = finalUrl;
          }
        }
      } else {
        toast.error('No URL provied');
        return;
      }
      return;
    }

    if (page?.type === 'app') {
      if (page?.appId) {
        const baseUrl = `${window.public_config?.TOOLJET_HOST}/applications/${page.appId}`;
        if (page.openIn === 'new_tab') {
          window.open(baseUrl, '_blank');
        } else {
          window.location.href = baseUrl;
        }
      } else {
        toast.error('No app selected');
        return;
      }
      return;
    }

    if (currentPageId === page?.id) {
      return;
    }
    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };
    switchPage(
      page?.id,
      pages.find((p) => page.id === p?.id)?.handle,
      currentMode === 'view' && !isPreviewInEditor ? Object.entries(queryParams) : []
    );
  };

  const switchToHomePage = () => {
    if (currentPageId === homePageId) return;

    const page = pages.find((p) => p.id === homePageId);

    const queryParams = {
      version: selectedVersionName,
      env: selectedEnvironmentName,
    };

    switchPage(
      page?.id,
      pages.find((p) => page.id === p?.id)?.handle,
      currentMode === 'view' && !isPreviewInEditor ? Object.entries(queryParams) : []
    );
  };

  const computedStyles = {
    '--nav-item-label-color': !styles.textColor.isDefault ? styles.textColor.value : 'var(--text-placeholder, #6A727C)',
    '--nav-item-icon-color': !styles.iconColor.isDefault ? styles.iconColor.value : 'var(--cc-default-icon, #6A727C)',
    '--selected-nav-item-label-color': !styles.selectedTextColor.isDefault
      ? styles.selectedTextColor.value
      : 'var(--cc-primary-text, #1B1F24)',
    '--selected-nav-item-icon-color': !styles.selectedIconColor.isDefault
      ? styles.selectedIconColor.value
      : 'var(--cc-default-icon, #6A727C)',
    '--hovered-nav-item-pill-bg': !styles.pillHoverBackgroundColor.isDefault
      ? styles.pillHoverBackgroundColor.value
      : 'var(--cc-surface2-surface, #F6F8FA)',
    '--selected-nav-item-pill-bg': !styles.pillSelectedBackgroundColor.isDefault
      ? styles.pillSelectedBackgroundColor.value
      : 'var(--cc-appBackground-surface, #F6F6F6)',
    '--nav-item-pill-radius': `${styles.pillRadius.value}px`,
  };

  if ((isPagesSidebarHidden && headerHidden && logoHidden) || !isMobileDevice) {
    return null;
  }

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

  const MenuBtn = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <div className="icon-btn tw-flex-shrink-0" onClick={toggleSidebar}>
        <SolidIcon width="16px" fill="var(--icon-strong)" name="menu" />
      </div>
    );
  };

  const MenuHeader = () => {
    const { toggleSidebar } = useSidebar();

    return (
      <Header className={'mobile-header'}>
        <div onClick={toggleSidebar} className="cursor-pointer">
          <div className="icon-btn">
            <Icons.IconX size={16} color="var(--icon-strong)" />
          </div>
        </div>
        <div className="w-100 tw-min-w-0 tw-shrink tw-px-[7px]">
          <h1 className="navbar-brand d-flex align-items-center justify-content-center tw-gap-[12px] p-0">
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
      </Header>
    );
  };

  const Body = () => {
    return (
      <RenderPageAndPageGroup
        isLicensed={hasAppPagesAddNavGroupEnabled}
        switchPageWrapper={switchPageWrapper}
        pages={pages}
        labelStyle={labelStyle}
        computedStyles={computedStyles}
        darkMode={darkMode}
        visibleLinks={mainNavBarPages}
        overflowLinks={[]}
        position="side"
        isSidebarPinned={true}
        currentMode="view"
        currentPageId={currentPageId}
        homePageId={homePageId}
      />
    );
  };

  const Footer = () => {
    return (
      showDarkModeToggle && (
        <div className="page-dark-mode-btn-wrapper !tw-pb-[calc(env(safe-area-inset-bottom)+10px)]">
          <DarkModeToggle
            switchDarkMode={switchDarkMode}
            darkMode={darkMode}
            showText={false}
            tooltipPlacement={'top'}
            toggleSize="large"
            btnClassName="tw-w-[36px] tw-h-[36px]"
          />
        </div>
      )
    );
  };

  const Sidebar = () => {
    return (
      <SidebarWrapper
        variant={'floating'}
        sidebarWidth="290px"
        sheetProps={{
          container: document.getElementsByClassName('canvas-wrapper')[0],
          overlayClassName: 'tw-absolute tw-h-dvh',
          className: `tw-absolute tw-p-0 mobile-page-menu-popup ${
            isMobilePreviewMode && !isPreviewInEditor
              ? 'tw-h-[calc(100%_-_44px)]' // To account for the preview settings header height
              : currentMode === 'view' && !isMobilePreviewMode
              ? 'tw-h-dvh' // In released app, the height should equal to mobile browsers viewport height
              : 'tw-h-full'
          }`,
          style: bgStyles,
        }}
        className="group-data-[side=left]:!tw-border-r-0"
        modal={(isMobilePreviewMode && isPreviewInEditor) || currentMode === 'edit' ? false : true}
      >
        <SidebarHeader>
          <MenuHeader />
        </SidebarHeader>
        <SidebarContent className="mobile-navigation-area page-menu-scroll">
          <Body />
        </SidebarContent>
        <SidebarFooter>
          <Footer />
        </SidebarFooter>
      </SidebarWrapper>
    );
  };

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      isMobile={true}
      sidebarWidth="290px"
      className="!tw-min-h-0 !tw-block"
      style={{
        ...bgStyles,
        flexShrink: 0,
      }}
    >
      <Header className={'mobile-nav-container'}>
        {!isPagesSidebarHidden && <MenuBtn />}
        {_renderAppNameAndLogo()}
      </Header>
      {!isPagesSidebarHidden && <Sidebar />}
    </SidebarProvider>
  );
};

export default MobileNavigationMenu;
