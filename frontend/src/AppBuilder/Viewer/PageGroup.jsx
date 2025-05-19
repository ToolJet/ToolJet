/* eslint-disable import/namespace */
import React, { useRef, useState } from 'react';
import _ from 'lodash';
import * as Icons from '@tabler/icons-react';
// eslint-disable-next-line import/no-unresolved
import FolderList from '@/_ui/FolderList/FolderList';
import useStore from '@/AppBuilder/_stores/store';
import { buildTree } from '../LeftSidebar/PageMenu/Tree/utilities';
import OverflowTooltip from '@/_components/OverflowTooltip';
import cx from 'classnames';

const RenderPage = ({ page, currentPageId, switchPageWrapper, labelStyle, computeStyles, darkMode, homePageId }) => {
  const isHomePage = page.id === homePageId;
  const iconName = isHomePage && !page.icon ? 'IconHome2' : page.icon;
  const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];
  return (page.hidden || page.disabled) && page?.restricted ? null : (
    <FolderList
      key={page.handle}
      onClick={() => switchPageWrapper(page?.id)}
      selectedItem={page?.id === currentPageId}
      CustomIcon={!labelStyle?.icon?.hidden && IconElement}
      customStyles={computeStyles}
      darkMode={darkMode}
    >
      {!labelStyle?.label?.hidden && (
        <span data-cy={`pages-name-${String(page?.name).toLowerCase()}`}>
          <OverflowTooltip style={{ width: '110px' }} childrenClassName={'mx-2 page-name'}>
            {page.name}
          </OverflowTooltip>
        </span>
      )}
    </FolderList>
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
}) => {
  const [hovered, setHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const contentRef = useRef(null);

  const IconElement = Icons?.[pageGroup.icon] ?? Icons?.['IconHome2'];

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
          />
        ))}
      </>
    );
  }

  const active = currentPage.pageGroupId === pageGroup.id;

  return (
    <div className={`accordion-item ${darkMode ? 'dark-mode' : ''}`}>
      <div
        className={`page-group-wrapper ${active ? 'active' : ''}`}
        style={{
          position: 'relative',
        }}
      >
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
        <FolderList
          key={pageGroup.id}
          onClick={handleToggle}
          CustomIcon={!labelStyle?.icon?.hidden && IconElement}
          customStyles={computeStyles}
          darkMode={darkMode}
          hovered={hovered}
        >
          {!labelStyle?.label?.hidden && (
            <span data-cy={`pages-name-${String(pageGroup?.name).toLowerCase()}`}>
              <OverflowTooltip style={{ width: '110px' }} childrenClassName={'mx-2 page-name'}>
                {pageGroup.name}
              </OverflowTooltip>
            </span>
          )}
        </FolderList>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const RenderPageAndPageGroup = ({ pages, labelStyle, computeStyles, darkMode, switchPageWrapper }) => {
  // Don't render empty folders if displaying only icons
  const tree = buildTree(pages, !!labelStyle?.label?.hidden);
  const filteredPages = tree.filter((page) => (!page?.isPageGroup || page.children?.length > 0) && !page?.restricted);
  const currentPageId = useStore((state) => state.currentPageId);
  const currentPage = pages.find((page) => page.id === currentPageId);
  const homePageId = useStore((state) => state.app.homePageId);
  return (
    <div className={cx('page-handler-wrapper viewer', { 'dark-theme': darkMode })}>
      {/* <Accordion alwaysOpen defaultActiveKey={tree.map((page) => page.id)}> */}
      {filteredPages.map((page, index) => {
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
          const renderSeparatorBottom = !filteredPages[index + 1]?.isPageGroup && labelStyle?.label?.hidden;
          return (
            <>
              {renderSeparatorTop && (
                <div
                  style={{
                    margin: '10px 0',
                    width: '100%',
                    borderTop: '1px solid var(--slate7)',
                  }}
                  className="separator-line"
                ></div>
              )}
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
              />
              {renderSeparatorBottom && (
                <div
                  style={{
                    margin: '10px 0',
                    width: '100%',
                    borderBottom: '1px solid var(--slate7)',
                  }}
                  className="separator-line"
                ></div>
              )}
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
            />
          );
        }
      })}
      {/* </Accordion> */}
    </div>
  );
};
