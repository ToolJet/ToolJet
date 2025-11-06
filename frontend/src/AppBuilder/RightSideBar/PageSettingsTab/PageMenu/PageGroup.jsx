/* eslint-disable import/namespace */
import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
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

export const RenderPage = ({
  page,
  currentPageId,
  switchPageWrapper,
  labelStyle,
  computeStyles,
  darkMode,
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

  const computedStyles = computeStyles(isActive, '');

  const Page = () => {
    return (
      <div key={page.name} data-id={page.id} className="tj-list-item-wrapper">
        <FolderList
          key={page.handle}
          onClick={() => {
            switchPageWrapper(page);
          }}
          selectedItem={isActive}
          CustomIcon={!labelStyle?.icon?.hidden && IconElement}
          customStyles={computeStyles}
          darkMode={darkMode}
          ariaLabel={page?.name}
        >
          {!labelStyle?.label?.hidden && (
            <div className="w-100 tw-overflow-hidden" data-cy={`pages-name-${String(page?.name).toLowerCase()}`}>
              <OverflowTooltip childrenClassName={'page-name'} style={{ ...{ ...computedStyles.text } }}>
                {page.name}
              </OverflowTooltip>
            </div>
          )}
        </FolderList>
      </div>
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
  computeStyles,
  darkMode,
  switchPageWrapper,
  homePageId,
  currentPageId,
  isSidebarPinned,
  position,
  currentMode,
  isPageGroupInsidePopup = true,
}) => {
  const active = currentPage?.pageGroupId === pageGroup?.id;
  const [isExpanded, setIsExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const contentRef = useRef(null);
  const groupItemRootRef = useRef(null);
  const computedStyles =
    position === 'top' && !isPageGroupInsidePopup
      ? computeStyles(active && !isExpanded, isExpanded)
      : computeStyles(active && !isExpanded, hovered);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && groupItemRootRef.current && !groupItemRootRef.current.contains(event.target)) {
        setIsExpanded((prev) => !prev);
      }
    };

    if (isExpanded && position === 'top') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

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
            computeStyles={computeStyles}
            darkMode={darkMode}
            homePageId={homePageId}
            position={position}
            currentMode={currentMode}
          />
        ))}
      </>
    );
  }

  // Wrap page group as navigation-menu item incase page menu is top aligned and part of visible links otherwise fall back to older flow
  return position === 'top' && !isPageGroupInsidePopup ? (
    <NavigationMenuItem
      key={pageGroup.name}
      data-id={pageGroup.id}
      ref={(el) => {
        groupItemRootRef.current = el;
      }}
    >
      <NavigationMenuTrigger
        indicator={false}
        className={`page-group-wrapper`}
        onClick={() => setIsExpanded((prev) => !prev)}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{ ...{ ...computedStyles.pill } }}
      >
        <div className="group-info">
          {!labelStyle?.icon?.hidden && (
            <div className="custom-icon">
              <IconElement
                color={computedStyles?.icon?.color}
                style={{
                  width: '16px',
                  height: '16px',
                  color: computedStyles?.icon?.color,
                  stroke: computedStyles?.icon?.color,
                }}
              />
            </div>
          )}
          {!labelStyle?.label?.hidden && (
            <div
              style={{ width: '100%', overflow: 'hidden' }}
              data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}
            >
              <OverflowTooltip childrenClassName={'page-name'} style={{ ...{ ...computedStyles.text } }}>
                {pageGroup.name}
              </OverflowTooltip>
            </div>
          )}
        </div>
        <div className="icon-btn cursor-pointer flex-shrink-0">
          <Icons.IconChevronUp
            size={16}
            color="var(--icon-default)"
            className={`tw-transition tw-duration-200 group-data-[state=closed]:tw-rotate-180`}
          />
        </div>
      </NavigationMenuTrigger>
      <NavigationMenuContent className={`!tw-min-w-full page-menu-popup ${darkMode && 'dark-theme'}`}>
        {pages.map((page) => (
          <RenderPage
            key={page.handle}
            page={page}
            currentPageId={currentPageId}
            switchPageWrapper={switchPageWrapper}
            labelStyle={labelStyle}
            computeStyles={computeStyles}
            darkMode={darkMode}
            homePageId={homePageId}
            position={position}
            currentMode={currentMode}
          />
        ))}
      </NavigationMenuContent>
    </NavigationMenuItem>
  ) : (
    <div
      key={pageGroup.name}
      data-id={pageGroup.id}
      ref={(el) => {
        groupItemRootRef.current = el;
      }}
      className={`accordion-item ${darkMode ? 'dark-mode' : ''}`}
    >
      <div
        className={`page-group-wrapper tj-list-item ${active && !isExpanded ? 'tj-list-item-selected' : ''}`}
        style={{
          ...{ ...computedStyles.pill },
        }}
        onClick={() => setIsExpanded((prev) => !prev)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <FolderList
          key={pageGroup.id}
          CustomIcon={!labelStyle?.icon?.hidden && IconElement}
          customStyles={computeStyles}
          darkMode={darkMode}
          ariaLabel={pageGroup.name}
        >
          {!labelStyle?.label?.hidden && (
            <div
              style={{ width: '100%', overflow: 'hidden' }}
              data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}
            >
              <OverflowTooltip childrenClassName={'page-name'} style={{ ...{ ...computedStyles.text } }}>
                {pageGroup.name}
              </OverflowTooltip>
            </div>
          )}
        </FolderList>
        <div className="icon-btn cursor-pointer flex-shrink-0">
          <Icons.IconChevronUp
            size={16}
            color="var(--icon-default)"
            className={`tw-transition tw-duration-200 ${!isExpanded && 'tw-rotate-180'}`}
          />
        </div>
      </div>

      <div className={`accordion-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div ref={contentRef} className="accordion-content">
          {pages.map((page) => (
            <RenderPage
              key={page.handle}
              page={page}
              currentPageId={currentPageId}
              switchPageWrapper={switchPageWrapper}
              labelStyle={labelStyle}
              computeStyles={computeStyles}
              darkMode={darkMode}
              homePageId={homePageId}
              position={position}
              currentMode={currentMode}
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
  computeStyles,
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
        return (
          isPageHidden === false && !child?.disabled && (currentMode === 'view' ? child?.restricted === false : true)
        );
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
                  computeStyles={computeStyles}
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
                computeStyles={computeStyles}
                darkMode={darkMode}
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
              <Icons.IconDotsVertical size={16} color="var(--cc-default-icon)" />
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
                        computeStyles={computeStyles}
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
                      computeStyles={computeStyles}
                      darkMode={darkMode}
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
      <NavigationMenuList className="page-handler-list">
        <RenderLinks />
      </NavigationMenuList>
    </NavigationMenu>
  ) : (
    <div className={cx('pages-wrapper viewer', { 'dark-theme': darkMode })}>
      <RenderLinks />
    </div>
  );
};
