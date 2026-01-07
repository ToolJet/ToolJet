import React, { useRef, useState, useEffect } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import { VirtuosoGrid } from 'react-virtuoso';
import { loadIcon } from '@/_helpers/iconLoader';
import { SearchBox } from '@/_components';
import useStore from '@/AppBuilder/_stores/store';

// Component to render individual icon in the picker
const IconItem = ({ iconName, onSelect }) => {
  const [IconElement, setIconElement] = useState(null);

  useEffect(() => {
    loadIcon(iconName)
      .then((component) => setIconElement(() => component))
      .catch(() => setIconElement(null));
  }, [iconName]);

  if (!IconElement) return <div className="icon-element p-2" />;

  return (
    <div className="icon-element p-2" onClick={() => onSelect(iconName)}>
      <IconElement stroke={1.5} strokeLinejoin="miter" style={{ width: '16px', height: '16px' }} />
    </div>
  );
};

export default function IconSelector({ iconName, iconColor, pageId, iconStyles, disabled = false }) {
  const [searchText, setSearchText] = useState('');
  const [showPopOver, setPopOverVisibility] = useState(false);
  const updatePageIcon = useStore((state) => state.updatePageIcon);
  // Hardcoded list of common Tabler icons
  const iconList = useRef([
    'IconHome2', 'IconChevronDown', 'IconChevronUp', 'IconChevronLeft', 'IconChevronRight',
    'IconX', 'IconCheck', 'IconPlus', 'IconMinus', 'IconEdit', 'IconTrash', 'IconSettings',
    'IconSearch', 'IconFilter', 'IconDownload', 'IconUpload', 'IconCopy', 'IconExternalLink',
    'IconRefresh', 'IconAlertCircle', 'IconMenu2', 'IconDots', 'IconStar', 'IconHeart',
    'IconBell', 'IconUser', 'IconMail', 'IconLock', 'IconKey', 'IconEye', 'IconEyeOff',
    'IconArrowLeft', 'IconArrowRight', 'IconArrowUp', 'IconArrowDown', 'IconCalendar',
    'IconClock', 'IconFile', 'IconFolder', 'IconImage', 'IconVideo', 'IconMusic',
  ]);
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
                  return (
                    <IconItem
                      key={filteredIcons[index]}
                      iconName={filteredIcons[index]}
                      onSelect={(iconName) => {
                        onIconSelect(iconName);
                        setPopOverVisibility(false);
                      }}
                    />
                  );
                }}
              />
            }
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  // Load selected icon dynamically
  const [IconElement, setIconElement] = useState(null);

  useEffect(() => {
    if (!iconName) {
      setIconElement(null);
      return;
    }

    loadIcon(iconName)
      .then((component) => setIconElement(() => component))
      .catch(() => setIconElement(null));
  }, [iconName]);

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
            style={{ width: '19px', height: '19px', color: iconColor, stroke: iconColor, ...iconStyles }}
          />
        </div>
      </div>
    </OverlayTrigger>
  );
}
