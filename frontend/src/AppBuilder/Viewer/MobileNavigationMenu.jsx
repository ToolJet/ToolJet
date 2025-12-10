import React, { useMemo } from 'react';
import _ from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { DarkModeToggle } from '@/_components/DarkModeToggle';
import Header from './Header';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from '../RightSideBar/PageSettingsTab/PageMenu/Tree/utilities';
import * as Icons from '@tabler/icons-react';
import AppLogo from '@/_components/AppLogo';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import toast from 'react-hot-toast';
import { RenderPageAndPageGroup } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/PageGroup';
import { shallow } from 'zustand/shallow';

const MobileNavigationMenu = ({
  pages,
  switchPage,
  switchToHomePage,
  currentPageId,
  darkMode,
  changeToDarkMode,
  showDarkModeToggle,
  appName,
  bgStyles,
}) => {
  const { moduleId } = useModuleContext();
  const { toggleSidebar } = useSidebar();
  const selectedVersionName = useStore((state) => state.selectedVersion?.name);
  const selectedEnvironmentName = useStore((state) => state.selectedEnvironment?.name);
  const currentLayout = useStore((state) => state.currentLayout, shallow);
  const selectedVersion = useStore((state) => state.selectedVersion, shallow);
  const isMobilePreviewMode = selectedVersion?.id && currentLayout === 'mobile';

  const hasAppPagesAddNavGroupEnabled = useStore((state) => state.license?.featureAccess?.appPagesAddNavGroupEnabled);
  const hasAppPagesHeaderAndLogoEnabled = useStore(
    (state) => state.license?.featureAccess?.appPagesHeaderAndLogoEnabled
  );

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
    switchPage(page?.id, pages.find((p) => page.id === p?.id)?.handle, Object.entries(queryParams));
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

  return (
    <Sidebar
      variant={'floating'}
      sidebarWidth="290px"
      sheetProps={{
        container: isMobilePreviewMode
          ? document.getElementsByClassName('canvas-area')[0]
          : document.querySelector('.viewer.mobile-view'),
        overlayClassName: 'tw-absolute tw-h-dvh',
        className: 'tw-absolute tw-h-dvh tw-p-0 mobile-page-menu-popup',
        style: bgStyles,
      }}
      className="group-data-[side=left]:!tw-border-r-0"
    >
      <SidebarHeader>
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
      </SidebarHeader>
      <SidebarContent className="mobile-navigation-area page-menu-scroll">
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
      </SidebarContent>
      <SidebarFooter>
        {showDarkModeToggle && (
          <div className="page-dark-mode-btn-wrapper !tw-pb-[calc(env(safe-area-inset-bottom)+10px)]">
            <DarkModeToggle
              switchDarkMode={changeToDarkMode}
              darkMode={darkMode}
              showText={false}
              tooltipPlacement={'top'}
              toggleSize="large"
              btnClassName="tw-w-[36px] tw-h-[36px]"
            />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default MobileNavigationMenu;
