import React, { useMemo } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from './Tree/utilities';
import * as Icons from '@tabler/icons-react';
import AppLogo from '@/_components/AppLogo';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { RenderPageAndPageGroup } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/PageGroup';
import { shallow } from 'zustand/shallow';
import Header from '@/AppBuilder/Viewer/Header';

const MobileNavigationMenu = ({ currentPageId, darkMode, switchDarkMode, bgStyles, headerHidden, logoHidden }) => {
  const { moduleId } = useModuleContext();
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode);
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile' && currentMode === 'view';
  const isPreviewInEditor = useStore((state) => state.isPreviewInEditor && currentMode === 'view', shallow);
  const showDarkModeToggle = useStore((state) => state.globalSettings.appMode === 'auto');
  const pages = useStore((state) => state.modules.canvas.pages, shallow);
  const appName = useStore((state) => state.appStore.modules[moduleId].app.appName);
  const switchToHomePage = useStore((state) => state.switchToHomePage);
  const switchPageWrapper = useStore((state) => state.switchPageWrapper);

  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);

  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);

  const { definition: { styles = {}, properties = {} } = {} } = useStore((state) => state.pageSettings) || {};
  const { name, style } = properties ?? {};

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

  // In mobile view, label will always be visible
  const labelStyle = useMemo(
    () => ({
      icon: {
        hidden: style === 'text',
      },
      label: {
        hidden: false,
      },
    }),
    [style]
  );

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

  return (
    <Sidebar
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
    </Sidebar>
  );
};

export default MobileNavigationMenu;
