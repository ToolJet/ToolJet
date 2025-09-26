/* eslint-disable import/namespace */
import React, { useEffect, useRef, useState } from 'react';
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

export const RenderPage = ({
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
  onPageClick,
  currentMode,
}) => {
  const pageVisibility = useStore((state) => state.getPagesVisibility('canvas', page?.id));
  const isHomePage = page.id === homePageId;
  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
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
  return pageVisibility || page.disabled || (page?.restricted && currentMode !== 'edit') ? null : (
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
          position !== 'side' && onPageClick();
        }}
        selectedItem={page?.id === currentPageId}
        CustomIcon={!labelStyle?.icon?.hidden && IconElement}
        customStyles={computeStyles}
        darkMode={darkMode}
      >
        {!labelStyle?.label?.hidden && (
          <div
            style={{ position: 'relative', overflow: 'hidden' }}
            // className={isSelected && 'tj-list-item-selected'}
            data-cy={`pages-name-${String(page?.name).toLowerCase()}`}
          >
            <OverflowTooltip style={{ width: '110px', position: 'relative' }} childrenClassName={'page-name'}>
              {page.name}
            </OverflowTooltip>
          </div>
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
  isExpanded,
  onToggle,
  onPageClick,
  currentMode,
}) => {
  const [hovered, setHovered] = useState(false);
  const [accordionPosition, setAccordionPosition] = useState({ top: 0, left: 0, width: 0 });
  const contentRef = useRef(null);
  const groupItemRootRef = useRef(null);
  const computedStyles = computeStyles('', hovered);
  const pageGroupVisibility = useStore((state) => state.getPagesVisibility('canvas', pageGroup?.id));

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
    onToggle(pageGroup.id);
  };

  useEffect(() => {
    const updatePosition = () => {
      if (isExpanded && groupItemRootRef.current) {
        const rect = groupItemRootRef.current.getBoundingClientRect();
        setAccordionPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (isExpanded) {
      updatePosition();

      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updatePosition();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      window.addEventListener('resize', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll, { passive: true, capture: true });
        window.removeEventListener('resize', handleScroll, { passive: true });
      };
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && groupItemRootRef.current && !groupItemRootRef.current.contains(event.target)) {
        const isClickOnAccordion = event.target.closest('.accordion-item');
        if (!isClickOnAccordion) {
          onToggle(pageGroup.id);
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, onToggle, pageGroup.id]);

  if (pageGroupVisibility) {
    return null;
  }

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
            callback={handleToggle}
            onPageClick={onPageClick}
            currentMode={currentMode}
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
      ref={(el) => {
        if (linkRefs?.current) {
          linkRefs.current[pageGroup.id] = el;
        }
        groupItemRootRef.current = el;
      }}
      className={`accordion-item ${darkMode ? 'dark-mode' : ''}`}
      style={{
        position: 'relative',
        zIndex: isExpanded ? 1000 : 'auto',
      }}
    >
      <div
        className={`page-group-wrapper tj-list-item ${active && !isExpanded ? 'tj-list-item-selected' : ''}`}
        style={{
          position: 'relative',
          ...{ ...computedStyles.pill },
        }}
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <FolderList
          key={pageGroup.id}
          CustomIcon={!labelStyle?.icon?.hidden && IconElement}
          customStyles={computeStyles}
          darkMode={darkMode}
        >
          {!labelStyle?.label?.hidden && (
            <div
              style={{ position: 'relative', overflow: 'hidden' }}
              data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}
            >
              <OverflowTooltip childrenClassName={'page-name'}>{pageGroup.name}</OverflowTooltip>
            </div>
          )}
        </FolderList>
        <div className="icon-btn cursor-pointer flex-shrink-0">
          <SolidIcon
            fill="var(--icon-default)"
            name={isExpanded ? 'caretup' : 'caretdown'}
            width="16"
            viewBox="0 0 16 16"
          />
        </div>
      </div>

      <div
        style={{
          top: accordionPosition.top,
          left: accordionPosition.left,
          zIndex: 1060,
        }}
        className={`accordion-body ${isExpanded ? 'show' : 'hide'}`}
      >
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
              onPageClick={onPageClick}
              currentMode={currentMode}
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
  currentMode,
}) => {
  const { moduleId } = useModuleContext();
  const [expandedPageGroupId, setExpandedPageGroupId] = useState(null);
  // Don't render empty folders if displaying only icons
  const navBarItems = pages.filter((p) => !p?.restricted);
  const currentPageId = useStore((state) => state.modules[moduleId].currentPageId);
  const currentPage = pages.find((page) => page.id === currentPageId);
  const homePageId = useStore((state) => state.appStore.modules[moduleId].app.homePageId);
  const [showPopover, setShowPopover] = useState(false);
  const getPagesVisibility = useStore((state) => state.getPagesVisibility);

  const handleAccordionToggle = (groupId) => {
    setExpandedPageGroupId((prevId) => {
      if (prevId === groupId) {
        return null;
      }
      return groupId;
    });
  };

  const closeAllAccordions = () => {
    if (showPopover) {
      setShowPopover(false);
    }
    setExpandedPageGroupId(null);
  };
  return (
    <div className={cx('page-handler-wrapper viewer', { 'dark-theme': darkMode })}>
      {/* <Accordion alwaysOpen defaultActiveKey={tree.map((page) => page.id)}> */}
      {visibleLinks.map((page, index) => {
        if (
          page.isPageGroup &&
          page.children?.length === 0 &&
          labelStyle?.label?.hidden &&
          page.children.some((child) => {
            const pageVisibility = getPagesVisibility('canvas', child?.id);
            return (
              pageVisibility === false &&
              !child?.disabled &&
              (currentMode === 'view' ? child?.restricted === false : true)
            );
          })
        ) {
          return null;
        }
        if (
          page.children &&
          page.isPageGroup &&
          page.children.some((child) => {
            const pageVisibility = getPagesVisibility('canvas', child?.id);
            return (
              pageVisibility === false &&
              !child?.disabled &&
              (currentMode === 'view' ? child?.restricted === false : true)
            );
          })
        ) {
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
                isExpanded={expandedPageGroupId === page.id}
                onToggle={handleAccordionToggle}
                onPageClick={closeAllAccordions}
                currentMode={currentMode}
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
              onPageClick={closeAllAccordions}
              currentMode={currentMode}
            />
          );
        }
      })}
      {overflowLinks.length > 0 && position === 'top' && (
        <>
          <button
            ref={moreBtnRef}
            onClick={() => setShowPopover(!showPopover)}
            className={`tj-list-item page-name more-btn-pages width-unset ${showPopover && 'tj-list-item-selected'}`}
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
            <Popover id="more-nav-btns" className={`${darkMode && 'dark-theme'}`}>
              <Popover.Body>
                {overflowLinks.map((page, index) => {
                  if (
                    page.isPageGroup &&
                    page.children.length === 0 &&
                    labelStyle?.label?.hidden &&
                    page.children.some((child) => {
                      const pageVisibility = getPagesVisibility('canvas', child?.id);
                      return (
                        pageVisibility === false &&
                        !child?.disabled &&
                        (currentMode === 'view' ? child?.restricted === false : true)
                      );
                    })
                  ) {
                    return null;
                  }
                  if (
                    page.children &&
                    page.isPageGroup &&
                    page.children.some((child) => {
                      const pageVisibility = getPagesVisibility('canvas', child?.id);
                      return (
                        pageVisibility === false &&
                        !child?.disabled &&
                        (currentMode === 'view' ? child?.restricted === false : true)
                      );
                    })
                  ) {
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
                          isExpanded={expandedPageGroupId === page.id}
                          onToggle={handleAccordionToggle}
                          onPageClick={closeAllAccordions}
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
                        onPageClick={closeAllAccordions}
                        currentMode={currentMode}
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
