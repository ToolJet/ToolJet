import React, { useEffect, useState } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import { DefaultCopyIcon } from './DefaultCopyIcon';

export const HiddenOptions = (props) => {
  const { nodeSpecificFilteredActions, generalActionsFiltered, darkMode, setActionClicked, data } = props;
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const [showMenu, setShowMenu] = useState(false);
  const closeMenu = () => {
    setShowMenu(false);
    setActionClicked(false);
  };

  const copyPath = () => {
    generalActionsFiltered[0].dispatchAction(data?.selectedNodePath);
  };

  const copyValue = () => {
    const value = getResolvedValue(`{{${data?.selectedNodePath}}}`);
    generalActionsFiltered[0].dispatchAction(value);
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
    return nodeSpecificFilteredActions?.map((actionOption, index) => {
      const { name, icon, src, iconName, dispatchAction, width = 12, height = 12 } = actionOption;
      if (icon) {
        return (
          <div className="node-action-icon" key={`${name}-${index}`}>
            <ToolTip message={`${name}`}>
              {/* ${name === 'Go to component' ? '' : currentNode} */}
              <span
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(event) => {
                  event.stopPropagation();
                  dispatchAction(data);
                }}
              >
                <img src={src ?? `assets/images/icons/${iconName}.svg`} width={width} height={height} />
              </span>
            </ToolTip>
          </div>
        );
      }
    });
  };

  return (
    <div
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="d-flex position-absolute"
    >
      {renderOptions()}
      <OverlayTrigger
        trigger={'click'}
        placement={'bottom-end'}
        rootClose={false}
        show={showMenu}
        overlay={
          <Popover className={cx('copy-menu-options', { 'dark-theme': darkMode })}>
            <Popover.Body bsPrefix="popover-body">
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
            </Popover.Body>
          </Popover>
        }
      >
        <div
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu((prev) => !prev);
            setActionClicked((prev) => !prev);
          }}
          className="node-action-icon"
          style={{
            outline: 'none',
            ...(showMenu && { backgroundColor: 'var(--button-outline-pressed, rgba(136, 144, 153, 0.18)' }),
          }}
        >
          <SolidIcon fill="#6A727C" width="12" height="12" name="copy" />
        </div>
      </OverlayTrigger>
    </div>
  );
};
