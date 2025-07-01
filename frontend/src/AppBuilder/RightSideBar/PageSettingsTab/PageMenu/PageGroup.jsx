/* eslint-disable import/namespace */
import React, { useRef, useState } from 'react';
import _ from 'lodash';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import useStore from '@/AppBuilder/_stores/store';
import OverflowTooltip from '@/_components/OverflowTooltip';
import cx from 'classnames';
import { buildTree } from './Tree/utilities';
import { Overlay, Popover } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { resolveReferences } from '@/_helpers/utils';

const RenderPage = ({
  page,
  currentPageId,
  switchPageWrapper,
  labelStyle,
  computeStyles,
  darkMode,
  homePageId,
  linkRefs,
  isSidebarPinned,
  callback,
  position,
}) => {
  const currentMode = useStore((state) => state.currentMode);
  const isHomePage = page.id === homePageId;
  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
  const IconElement = (props) => {
    const Icon = Icons?.[iconName] ?? Icons?.['IconFileDescription'];

    if (!isSidebarPinned || labelStyle?.label?.hidden) {
      return (
        <ToolTip message={page?.name} placement={'right'}>
          <Icon {...props} />
        </ToolTip>
      );
    }

    return <Icon {...props} />;
  };
  return (resolveReferences(page?.hidden?.value) || page.disabled) && page?.restricted ? null : (
    <div
      key={page.name}
      data-id={page.id}
      ref={(el) => {
        if (el) {
          if (linkRefs?.current) {
            linkRefs.current[page.id] = el;
          }
        }
      }}
    >
      <FolderList
        key={page.handle}
        onClick={() => {
          switchPageWrapper(page);
          callback && position !== 'side' && callback();
        }}
        selectedItem={page?.id === currentPageId}
        CustomIcon={!labelStyle?.icon?.hidden && IconElement}
        customStyles={computeStyles}
        darkMode={darkMode}
      >
        {!labelStyle?.label?.hidden && (
          <span
            // className={isSelected && 'tj-list-item-selected'}
            data-cy={`pages-name-${String(page?.name).toLowerCase()}`}
          >
            <OverflowTooltip style={{ width: '110px', position: 'relative' }} childrenClassName={'page-name'}>
              {page.name}
            </OverflowTooltip>
          </span>
        )}
      </FolderList>
    </div>
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
  linkRefs,
  isSidebarPinned,
  position,
}) => {
  const currentMode = useStore((state) => state.currentMode);

  const [hovered, setHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef(null);

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

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

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
          />
        ))}
      </>
    );
  }

  const active = currentPage?.pageGroupId === pageGroup?.id;

  return (
    <div
      key={pageGroup.name}
      data-id={pageGroup.id}
      ref={(el) => linkRefs?.current && (linkRefs.current[pageGroup.id] = el)}
      className={`accordion-item ${darkMode ? 'dark-mode' : ''}`}
    >
      <div
        className={`page-group-wrapper tj-list-item ${active && !isExpanded ? 'tj-list-item-selected' : ''}`}
        style={{
          position: 'relative',
        }}
      >
        <FolderList
          key={pageGroup.id}
          onClick={isSidebarPinned && handleToggle}
          CustomIcon={!labelStyle?.icon?.hidden && IconElement}
          customStyles={computeStyles}
          darkMode={darkMode}
          hovered={hovered}
        >
          {!labelStyle?.label?.hidden && (
            <span data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}>
              <OverflowTooltip style={{ width: '110px' }} childrenClassName={'page-name'}>
                {pageGroup.name}
              </OverflowTooltip>
            </span>
          )}
        </FolderList>
        <div style={{ marginRight: '12px' }}>
          <svg
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleToggle}
            className={`page-group-collapse ${isExpanded ? 'expanded' : 'collapsed'}`}
            width={17}
            height={16}
            viewBox="0 0 17 16"
            fill="black"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.1257 4L5.27446 4C4.50266 4 4.02179 4.83721 4.41068 5.50387L7.33631 10.5192C7.72218 11.1807 8.67798 11.1807 9.06386 10.5192L11.9895 5.50387C12.3784 4.83721 11.8975 4 11.1257 4Z"
              fill="#ACB2B9"
            />
          </svg>
        </div>
      </div>

      <div className={`accordion-body ${isExpanded ? 'show' : 'hide'}`}>
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
              linkRefs={linkRefs}
              callback={handleToggle}
              position={position}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const RenderPageAndPageGroup = ({
  pages,
  labelStyle,
  computeStyles,
  darkMode,
  switchPageWrapper,
  visibleLinks,
  overflowLinks,
  linkRefs,
  moreBtnRef,
  position,
  style,
  isSidebarPinned,
}) => {
  const { moduleId } = useModuleContext();
  // Don't render empty folders if displaying only icons
  const visibleTree = buildTree(position === 'top' ? visibleLinks : pages, !!labelStyle?.label?.hidden);
  const overflowTree = buildTree(overflowLinks, !!labelStyle?.label?.hidden);
  const filteredPagesVisible = visibleTree.filter(
    (page) => (!page?.isPageGroup || page.children?.length > 0) && !page?.restricted
  );
  const filteredPagesOverflow = overflowTree.filter(
    (page) => (!page?.isPageGroup || page.children?.length > 0) && !page?.restricted
  );
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const currentPage = pages.find((page) => page.id === currentPageId);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const [showPopover, setShowPopover] = useState(false);
  return (
    <div className={cx('page-handler-wrapper viewer', { 'dark-theme': darkMode })}>
      {/* <Accordion alwaysOpen defaultActiveKey={tree.map((page) => page.id)}> */}
      {filteredPagesVisible.map((page, index) => {
        if (
          page.isPageGroup &&
          page.children.length === 0 &&
          labelStyle?.label?.hidden &&
          !page.children.some((child) => child?.restricted === true)
        ) {
          return null;
        }
        if (page.children && page.isPageGroup && !page.children.some((child) => child?.restricted === true)) {
          // if we are only displaying icons, we don't display the groups instead display separator to separate a page groups
          const renderSeparatorTop = index !== 0 && labelStyle?.label?.hidden;
          const renderSeparatorBottom = !filteredPagesVisible[index + 1]?.isPageGroup && labelStyle?.label?.hidden;
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
                linkRefs={linkRefs}
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
              linkRefs={linkRefs}
              isSidebarPinned={isSidebarPinned}
              position={position}
            />
          );
        }
      })}
      {filteredPagesOverflow.length > 0 && position === 'top' && (
        <>
          <button
            ref={moreBtnRef}
            onClick={() => setShowPopover(!showPopover)}
            className="tj-list-item page-name"
            style={{ cursor: 'pointer', fontSize: '14px', marginLeft: '0px' }}
          >
            <SolidIcon fill={'var(--icon-weak)'} viewBox="0 3 21 18" width="16px" name="morevertical" />
            <div style={{ marginLeft: '6px' }}>More</div>
          </button>

          <Overlay
            show={showPopover}
            target={moreBtnRef.current}
            placement="bottom-end"
            onHide={() => setShowPopover(false)}
            rootClose
          >
            <Popover id="more-nav-btns">
              <Popover.Body>
                {filteredPagesOverflow.map((page, index) => {
                  if (
                    page.isPageGroup &&
                    page.children.length === 0 &&
                    labelStyle?.label?.hidden &&
                    !page.children.some((child) => child?.restricted === true)
                  ) {
                    return null;
                  }
                  if (page.children && page.isPageGroup && !page.children.some((child) => child?.restricted === true)) {
                    // if we are only displaying icons, we don't display the groups instead display separator to separate a page groups
                    const renderSeparatorTop = index !== 0 && labelStyle?.label?.hidden;
                    const renderSeparatorBottom =
                      !filteredPagesOverflow[index + 1]?.isPageGroup && labelStyle?.label?.hidden;
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
                          linkRefs={linkRefs}
                          isSidebarPinned={isSidebarPinned}
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
                        linkRefs={linkRefs}
                        isSidebarPinned={isSidebarPinned}
                      />
                    );
                  }
                })}
              </Popover.Body>
            </Popover>
          </Overlay>
        </>
      )}
      {/* </Accordion> */}
    </div>
  );
};
