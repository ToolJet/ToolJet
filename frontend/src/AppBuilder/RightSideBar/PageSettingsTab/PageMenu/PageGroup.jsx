/* eslint-disable import/namespace */
import React, { useRef, useState } from 'react';
import _ from 'lodash';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import useStore from '@/AppBuilder/_stores/store';
import OverflowTooltip from '@/_components/OverflowTooltip';
import cx from 'classnames';
import { ToolTip } from '@/_components';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const RenderPage = ({
  page,
  currentPageId,
  switchPageWrapper,
  labelStyle,
  homePageId,
  isSidebarPinned,
  position,
  currentMode,
  isPageInsidePopup = true,
}) => {
  const isPageHidden = useStore((state) => state.getPagesVisibility('canvas', page?.id)); // TODO: rename the getPagesVisibility to getIsPageHidden in state since purpose of the function is to check if the page is hidden
  const isHomePage = page.id === homePageId;
  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
  const isActive = page?.id === currentPageId;

  if (isPageHidden || page.disabled || (page?.restricted && currentMode !== 'edit')) return null;

  const IconElement = (props) => {
    const Icon = Icons?.[iconName] ?? Icons?.['IconFile'];

    if (!isSidebarPinned || labelStyle?.label?.hidden) {
      return (
        <ToolTip message={page?.name} placement={'right'}>
          <Icon {...props} />
        </ToolTip>
      );
    }

    return <Icon {...props} />;
  };

  const iconColor = isActive ? 'var(--selected-nav-item-icon-color)' : 'var(--nav-item-icon-color)';

  const Page = () => {
    return (
      <button
        key={page.id}
        data-id={page.id}
        className={`tj-list-item ${isActive && 'tj-list-item-selected'}`}
        onClick={() => {
          switchPageWrapper(page);
        }}
        aria-label={page.name}
      >
        {!labelStyle?.icon?.hidden && (
          <div className="custom-icon" data-cy={`pages-icon-${String(page?.name).toLowerCase()}`}>
            <IconElement
              color={iconColor}
              style={{
                width: '16px',
                height: '16px',
                color: iconColor,
                stroke: iconColor,
              }}
            />
          </div>
        )}
        {!labelStyle?.label?.hidden && (
          <div className="w-100 tw-overflow-hidden" data-cy={`pages-name-${String(page?.name).toLowerCase()}`}>
            <OverflowTooltip childrenClassName={'page-name'}>{page.name}</OverflowTooltip>
          </div>
        )}
      </button>
    );
  };

  // Wrap page as navigation-menu item incase page menu is top aligned and part of visible links otherwise fall back to older flow
  return position === 'top' && !isPageInsidePopup ? (
    <NavigationMenuItem key={page.name}>
      <Page />
    </NavigationMenuItem>
  ) : (
    <Page />
  );
};

const RenderPageGroup = ({
  pages,
  pageGroup,
  currentPage,
  labelStyle,
  darkMode,
  switchPageWrapper,
  homePageId,
  currentPageId,
  isSidebarPinned,
  position,
  currentMode,
  isPageGroupInsidePopup = true,
}) => {
  const isActive = currentPage?.pageGroupId === pageGroup?.id;
  const [isExpanded, setIsExpanded] = useState(isActive);
  const groupItemRootRef = useRef(null);
  const isPageGroupHidden = useStore((state) => state.getPagesVisibility('canvas', pageGroup?.id));

  const IconElement = (props) => {
    const Icon = Icons?.[pageGroup.icon] ?? Icons?.['IconHome2'];

    if ((!isSidebarPinned && currentMode === 'view') || labelStyle?.label?.hidden) {
      return (
        <ToolTip message={pageGroup?.name} placement={'right'}>
          <Icon {...props} />
        </ToolTip>
      );
    }

    return <Icon {...props} />;
  };

  if (isPageGroupHidden) {
    return null;
  }

  // Display all the pages inside the page group without the page group itself incase label is hidden
  if (labelStyle?.label?.hidden) {
    return (
      <>
        {pages.map((page) => (
          <RenderPage
            key={page.handle}
            page={page}
            currentPageId={currentPageId}
            switchPageWrapper={switchPageWrapper}
            labelStyle={labelStyle}
            homePageId={homePageId}
            position={position}
            currentMode={currentMode}
            isSidebarPinned={isSidebarPinned}
          />
        ))}
      </>
    );
  }

  const TriggerBody = () => {
    return (
      <div className="group-info">
        {!labelStyle?.icon?.hidden && (
          <div className="custom-icon">
            <IconElement
              className={`tw-h-[16px] tw-w-[16px] tw-text-[var(--nav-item-icon-color)] ${
                isActive && 'group-data-[state=closed]:!tw-text-[var(--selected-nav-item-icon-color)]'
              }`}
            />
          </div>
        )}
        {!labelStyle?.label?.hidden && (
          <div
            style={{ width: '100%', overflow: 'hidden' }}
            data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}
          >
            <OverflowTooltip childrenClassName={'page-name'}>{pageGroup.name}</OverflowTooltip>
          </div>
        )}
      </div>
    );
  };

  // Wrap page group as navigation-menu item incase page menu is top aligned and part of visible links otherwise fall back to older flow
  return position === 'top' && !isPageGroupInsidePopup ? (
    <NavigationMenuItem
      key={pageGroup.id}
      data-id={pageGroup.id}
      ref={(el) => {
        groupItemRootRef.current = el;
      }}
    >
      <NavigationMenuTrigger
        indicator={false}
        className={`page-group-wrapper ${isActive && 'page-group-selected'}`}
        aria-label={pageGroup.name}
      >
        <TriggerBody />
        <Icons.IconChevronUp
          size={16}
          color="var(--nav-item-icon-color)"
          className={`cursor-pointer tw-flex-shrink-0 tw-transition tw-duration-200 group-data-[state=closed]:tw-rotate-180`}
        />
      </NavigationMenuTrigger>
      <NavigationMenuContent className={`!tw-min-w-full page-menu-popup ${darkMode && 'dark-theme'}`}>
        {pages.map((page) => (
          <RenderPage
            key={page.handle}
            page={page}
            currentPageId={currentPageId}
            switchPageWrapper={switchPageWrapper}
            labelStyle={labelStyle}
            homePageId={homePageId}
            position={position}
            currentMode={currentMode}
            isSidebarPinned={isSidebarPinned}
          />
        ))}
      </NavigationMenuContent>
    </NavigationMenuItem>
  ) : (
    <div
      key={pageGroup.id}
      data-id={pageGroup.id}
      ref={(el) => {
        groupItemRootRef.current = el;
      }}
      className={`accordion-item ${darkMode && 'dark-theme'}`}
    >
      <button
        className={`tw-group page-group-wrapper ${isActive && 'page-group-selected'}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        data-state={isExpanded ? 'open' : 'closed'}
        aria-label={pageGroup.name}
        aria-expanded={isExpanded}
      >
        <TriggerBody />
        <Icons.IconChevronUp
          size={16}
          color="var(--nav-item-icon-color)"
          className={`cursor-pointer tw-flex-shrink-0 tw-transition tw-duration-200 group-data-[state=closed]:tw-rotate-180`}
        />
      </button>

      <div className={`accordion-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="accordion-content">
          {pages.map((page) => (
            <RenderPage
              key={page.handle}
              page={page}
              currentPageId={currentPageId}
              switchPageWrapper={switchPageWrapper}
              labelStyle={labelStyle}
              homePageId={homePageId}
              position={position}
              currentMode={currentMode}
              isSidebarPinned={isSidebarPinned}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const RenderPageAndPageGroup = ({
  isLicensed,
  pages,
  labelStyle,
  computedStyles,
  darkMode,
  switchPageWrapper,
  visibleLinks,
  overflowLinks,
  position,
  isSidebarPinned,
  currentMode,
  currentPageId,
  homePageId,
}) => {
  const currentPage = pages.find((page) => page.id === currentPageId);
  const getIsPageHidden = useStore((state) => state.getPagesVisibility); // TODO: rename the getPagesVisibility to getIsPageHidden in state since purpose of the function is to check if the page is hidden

  const isEmptyPageGroup = (page) => {
    return isLicensed && page.isPageGroup && page.children?.length === 0;
  };

  const isPageGroupWithChildren = (page) => {
    return (
      isLicensed &&
      page.isPageGroup &&
      page.children &&
      // check if the page group has at least one visible child
      page.children.some((child) => {
        const isPageHidden = getIsPageHidden('canvas', child?.id);
        return isPageHidden === false && !child?.disabled && (currentMode === 'view' ? !child?.restricted : true);
      })
    );
  };

  // Don't render page groups without valid license
  const RenderLinks = () => {
    return (
      <>
        {visibleLinks.map((page, index) => {
          if (isEmptyPageGroup(page)) {
            return null;
          }
          if (isPageGroupWithChildren(page)) {
            return (
              <>
                <RenderPageGroup
                  switchPageWrapper={switchPageWrapper}
                  homePageId={homePageId}
                  currentPageId={currentPageId}
                  key={page.id}
                  pages={page.children}
                  pageGroup={page}
                  currentPage={currentPage}
                  labelStyle={labelStyle}
                  darkMode={darkMode}
                  isSidebarPinned={isSidebarPinned}
                  position={position}
                  currentMode={currentMode}
                  isPageGroupInsidePopup={false}
                />
              </>
            );
          } else if (!page.isPageGroup) {
            return (
              <RenderPage
                key={page.handle}
                page={page}
                currentPageId={currentPageId}
                switchPageWrapper={switchPageWrapper}
                labelStyle={labelStyle}
                homePageId={homePageId}
                isSidebarPinned={isSidebarPinned}
                position={position}
                currentMode={currentMode}
                isPageInsidePopup={false}
              />
            );
          }
        })}
        {/* Menu item for showing overflowing items using a more button */}
        {overflowLinks.length > 0 && position === 'top' && (
          <NavigationMenuItem>
            <NavigationMenuTrigger indicator={false} className={`more-pages-btn`}>
              <Icons.IconDotsVertical size={16} color="var(--nav-item-icon-color)" />
              More
            </NavigationMenuTrigger>
            <NavigationMenuContent className={`!tw-min-w-full page-menu-popup ${darkMode && 'dark-theme'}`}>
              {overflowLinks.map((page, index) => {
                if (isEmptyPageGroup(page)) {
                  return null;
                }
                if (isPageGroupWithChildren(page)) {
                  return (
                    <>
                      <RenderPageGroup
                        switchPageWrapper={switchPageWrapper}
                        homePageId={homePageId}
                        currentPageId={currentPageId}
                        key={page.id}
                        pages={page.children}
                        pageGroup={page}
                        currentPage={currentPage}
                        labelStyle={labelStyle}
                        darkMode={darkMode}
                        isSidebarPinned={isSidebarPinned}
                        position={position}
                      />
                    </>
                  );
                } else if (!page.isPageGroup) {
                  return (
                    <RenderPage
                      key={page.handle}
                      page={page}
                      currentPageId={currentPageId}
                      switchPageWrapper={switchPageWrapper}
                      labelStyle={labelStyle}
                      homePageId={homePageId}
                      isSidebarPinned={isSidebarPinned}
                      currentMode={currentMode}
                      position={position}
                    />
                  );
                }
              })}
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </>
    );
  };

  // Using shadcn navigation-menu component when the page menu is top aligned
  return position === 'top' ? (
    <NavigationMenu viewport={false} className="pages-wrapper">
      <NavigationMenuList className="page-handler-list" style={computedStyles}>
        <RenderLinks />
      </NavigationMenuList>
    </NavigationMenu>
  ) : (
    <div className={cx('pages-wrapper viewer', { 'dark-theme': darkMode })} style={computedStyles}>
      <RenderLinks />
    </div>
  );
};
