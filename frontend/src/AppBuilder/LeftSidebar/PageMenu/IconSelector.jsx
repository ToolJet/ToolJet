import React, { useRef, useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import { VirtuosoGrid } from 'react-virtuoso';
import * as Icons from '@tabler/icons-react';
import { SearchBox } from '@/_components';
import useStore from '@/AppBuilder/_stores/store';

export default function IconSelector({ iconName, iconColor, pageId, disabled = false }) {
  const [searchText, setSearchText] = useState('');
  const [showPopOver, setPopOverVisibility] = useState(false);
  const updatePageIcon = useStore((state) => state.updatePageIcon);
  const iconList = useRef(Object.keys(Icons));
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const searchIcon = (text) => {
    if (searchText === text) return;
    setSearchText(text);
  };

  const filteredIcons =
    searchText === ''
      ? iconList.current
      : iconList.current.filter((icon) => icon?.toLowerCase().includes(searchText ? searchText.toLowerCase() : ''));

  const onIconSelect = (icon) => {
    updatePageIcon(pageId, icon);
  };

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '460px', maxWidth: '460px' }}
        className={`icon-widget-popover ${darkMode && 'dark-theme theme-dark'}`}
      >
        <Popover.Header>
          <SearchBox onSubmit={searchIcon} width="100%" />
        </Popover.Header>
        <Popover.Body>
          <div className="row">
            {
              <VirtuosoGrid
                style={{ height: 300 }}
                totalCount={filteredIcons.length}
                listClassName="icon-list-wrapper"
                itemClassName="icon-list"
                itemContent={(index) => {
                  if (filteredIcons[index] === undefined || filteredIcons[index] === 'createReactComponent')
                    return null;
                  // eslint-disable-next-line import/namespace
                  const IconElement = Icons[filteredIcons[index]];
                  return (
                    <div
                      className="icon-element p-2"
                      onClick={() => {
                        onIconSelect(filteredIcons[index]);
                        setPopOverVisibility(false);
                      }}
                    >
                      <IconElement stroke={1.5} strokeLinejoin="miter" style={{ width: '16px', height: '16px' }} />
                    </div>
                  );
                }}
              />
            }
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  // eslint-disable-next-line import/namespace
  const IconElement = Icons?.[iconName] ?? Icons?.['IconFileDescription'];

  return (
    <OverlayTrigger
      trigger="click"
      placement={'bottom'}
      show={showPopOver}
      rootClose={true}
      overlay={eventPopover()}
      {...(!disabled && { onToggle: (showing) => setPopOverVisibility(showing) })}
    >
      <div className={cx('d-flex align-items-center icon-selector', { 'selector-open': showPopOver })} role="button">
        <div className="">
          <IconElement
            color={`${iconColor}`}
            style={{ width: '19px', height: '19px', color: iconColor, stroke: iconColor }}
          />
        </div>
      </div>
    </OverlayTrigger>
  );
}
