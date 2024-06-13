import React, { useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SearchBox } from '@/_components/SearchBox';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Visibility } from './Visibility';

export const Icon = ({ value, onChange, onVisibilityChange, component }) => {
  const [searchText, setSearchText] = useState('');
  const [showPopOver, setPopOverVisibility] = useState(false);
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
    onChange(icon);
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
                      <IconElement
                        color={`${darkMode ? '#fff' : '#000'}`}
                        stroke={1.5}
                        strokeLinejoin="miter"
                        style={{ width: '24px', height: '24px' }}
                      />
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

  function RenderIconPicker() {
    // eslint-disable-next-line import/namespace
    const IconElement = Icons?.[value] ?? Icons?.['IconHome2'];

    return (
      <>
        <div className="color-picker-input icon-style-container">
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
                  <div className="" style={{ marginRight: '2px' }}>
                    <IconElement
                      data-cy={`icon-on-side-panel`}
                      color={`${darkMode ? '#fff' : '#000'}`}
                      stroke={1.5}
                      strokeLinejoin="miter"
                      style={{ width: '24px', height: '24px' }}
                    />
                  </div>
                  <div
                    className="text-truncate tj-text-xsm"
                    style={{
                      width: '80px',
                      color: 'var(--slate12)',
                    }}
                  >
                    {value}
                  </div>
                  <Visibility
                    value={value}
                    onChange={onChange}
                    onVisibilityChange={onVisibilityChange}
                    component={component}
                  />
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
