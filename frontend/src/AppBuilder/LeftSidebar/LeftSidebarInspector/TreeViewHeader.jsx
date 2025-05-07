import React, { useEffect, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import ArrowLeft from '@/_ui/Icon/bulkIcons/Arrowleft';
import CheveronRight from '@/_ui/Icon/bulkIcons/CheveronRight';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { DefaultCopyIcon } from './DefaultCopyIcon';

export const TreeViewHeader = (props) => {
  const { path, backFn, darkMode, data, nodeSpecificActions, type, generalActions } = props;
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const [showMenu, setShowMenu] = useState(false);
  const pathArray = path.split('.');
  const parentNode = pathArray[0];

  const closeMenu = () => {
    setShowMenu(false);
  };

  const copyPath = () => {
    generalActions[0].dispatchAction(data?.selectedNodePath);
  };

  const copyValue = () => {
    const value = getResolvedValue(`{{${data?.selectedNodePath}}}`);
    generalActions[0].dispatchAction(value);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.copy-menu-options') === null) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderOptions = () => {
    return (
      <>
        <div className="menu-options mb-0">
          <div
            onClick={(event) => {
              event.stopPropagation();
              copyPath();
              closeMenu();
            }}
            className="option"
          >
            <SolidIcon width="12" height="12" name="copy" />
            <span> Copy path</span>
          </div>
          <div
            onClick={(event) => {
              event.stopPropagation();
              copyValue();
              closeMenu();
            }}
            className="option"
          >
            <DefaultCopyIcon />
            <span> Copy value</span>
          </div>
        </div>

        {nodeSpecificActions?.map((actionOption, index) => {
          const { name, icon, src, iconName, dispatchAction, width = 12, height = 12 } = actionOption;
          if (icon) {
            return (
              <div className="menu-options mb-0" key={`${name}-${index}`}>
                <span
                  style={{ display: 'flex', alignItems: 'center' }}
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatchAction(data);
                    setShowMenu(false);
                  }}
                  className="option"
                >
                  <img src={src ?? `assets/images/icons/${iconName}.svg`} width={width} height={height} />
                  {name}
                </span>
              </div>
            );
          }
        })}
      </>
    );
  };

  return (
    <div className="json-viewer-header">
      {/* <div className="json-viewer-back-btn" onClick={backFn}>
        <ArrowLeft tailOpacity="1" fill={'var(--slate12)'} width={'18'} />
      </div> */}
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={backFn}>
        <span style={{ color: 'var(--slate11)' }}>{parentNode.charAt(0).toUpperCase() + parentNode.slice(1)}</span>

        {pathArray.length > 1 &&
          pathArray.slice(1).map((item, index) => (
            <>
              <CheveronRight fill={'var(--slate12)'} width={'18'} />
              <span key={index} style={{ color: 'var(--slate12)' }}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </span>
            </>
          ))}
      </div>

      <OverlayTrigger
        trigger={'click'}
        placement={'bottom-start'}
        rootClose={false}
        show={showMenu}
        overlay={
          <Popover
            style={{ width: type === 'components' ? '180px' : '144px' }}
            className={cx('copy-menu-options', { 'dark-theme': darkMode })}
          >
            <Popover.Body bsPrefix="popover-body">{renderOptions()}</Popover.Body>
          </Popover>
        }
      >
        <div
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu((prev) => !prev);
          }}
          className="copy-menu-options-icon json-viewer-options-btn"
          style={{
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <SolidIcon data-cy={'menu-icon'} name="morevertical" width="18" fill={'#6A727C'} />
        </div>
      </OverlayTrigger>
    </div>
  );
};
