import React, { useRef, useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SearchBox } from '@/_components/SearchBox';
import { loadIcon } from '@/_helpers/iconLoader';
import { VirtuosoGrid } from 'react-virtuoso';
import { Visibility } from './Visibility';

// Component to render individual icon in the picker
const IconItem = ({ iconName, onSelect, darkMode }) => {
  const [IconElement, setIconElement] = useState(null);

  useEffect(() => {
    loadIcon(iconName)
      .then((component) => setIconElement(() => component))
      .catch(() => setIconElement(null));
  }, [iconName]);

  if (!IconElement) return <div className="icon-element p-2" />;

  return (
    <div className="icon-element p-2" onClick={() => onSelect(iconName)}>
      <IconElement
        color={`${darkMode ? '#fff' : '#000'}`}
        stroke={1.5}
        strokeLinejoin="miter"
        style={{ width: '24px', height: '24px' }}
      />
    </div>
  );
};

export const Icon = ({
  value,
  onChange,
  onVisibilityChange,
  styleDefinition,
  component,
  isVisibilityEnabled = true,
  iconVisibility,
}) => {
  const [searchText, setSearchText] = useState('');
  const [showPopOver, setPopOverVisibility] = useState(false);
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
    onChange(icon);
  };

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '460px', maxWidth: '460px' }}
        className={`icon-widget-popover ${darkMode && 'dark-theme theme-dark'}`}
        onClick={(event) => event.stopPropagation()}
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
                      darkMode={darkMode}
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

  function RenderIconPicker() {
    const [IconElement, setIconElement] = useState(null);

    useEffect(() => {
      const iconName = value || 'IconHome2';
      loadIcon(iconName)
        .then((component) => setIconElement(() => component))
        .catch(() => loadIcon('IconHome2').then((component) => setIconElement(() => component)));
    }, [value]);

    if (!IconElement) {
      return (
        <div className="color-picker-input icon-style-container" style={{ position: 'relative' }}>
          <div className="p-0">
            <div className="field">
              <div className="d-flex align-items-center">
                <div style={{ marginRight: '2px', marginLeft: '6px', height: '20px', width: '18px' }}>
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="color-picker-input icon-style-container" style={{ position: 'relative' }}>
          <div className="p-0">
            <div className="field">
              <OverlayTrigger
                trigger="click"
                placement={'left'}
                show={showPopOver}
                onToggle={(showing) => setPopOverVisibility(showing)}
                rootClose={true}
                overlay={eventPopover()}
              >
                <div className="d-flex align-items-center" role="button">
                  <div className="" style={{ marginRight: '2px', marginLeft: '6px', height: '20px', width: '18px' }}>
                    <IconElement
                      data-cy={`icon-on-side-panel`}
                      color={`${darkMode ? '#fff' : '#000'}`}
                      stroke={1.5}
                      strokeLinejoin="miter"
                      style={{ width: '18px', height: '18px' }}
                    />
                  </div>
                  <div
                    className="text-truncate tj-text-xsm"
                    style={{
                      width: '80px',
                      color: 'var(--slate12)',
                    }}
                  >
                    {String(value)}
                  </div>
                  {isVisibilityEnabled && (
                    <Visibility
                      value={value}
                      onChange={onChange}
                      onVisibilityChange={onVisibilityChange}
                      component={component}
                      styleDefinition={styleDefinition}
                      iconVisibility={iconVisibility}
                    />
                  )}
                </div>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </>
    );
  }
  return <>{RenderIconPicker()}</>;
};
