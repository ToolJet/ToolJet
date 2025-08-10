import React, { useEffect, useState } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';
import { DefaultCopyIcon } from './DefaultCopyIcon';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import { formatPathForCopy } from './utils';

export const HiddenOptions = (props) => {
  const { nodeSpecificFilteredActions, generalActionsFiltered, darkMode, setActionClicked, data } = props;
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const [showMenu, setShowMenu] = useState(false);
  const closeMenu = () => {
    setShowMenu(false);
  };

  const copyPath = () => {
    const formattedPath = formatPathForCopy(data?.selectedNodePath);
    generalActionsFiltered[0].dispatchAction(formattedPath, false);
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

  // This is to ensure that the actionClicked state is updated when the menu is shown or deleted on the next render to avoid misplacing the Popover
  useEffect(() => {
    setTimeout(() => setActionClicked(showMenu), 0);
  }, [showMenu]);

  const renderOptions = () => {
    return nodeSpecificFilteredActions?.map((actionOption, index) => {
      const { name, icon, src, iconName, dispatchAction, width = 12, height = 12 } = actionOption;
      if (icon) {
        return (
          <div
            className="node-action-icon"
            key={`${name}-${index}`}
            data-cy={`inspector-${generateCypressDataCy(name || '')}-action`}
          >
            <ToolTip message={`${name}`}>
              {/* ${name === 'Go to component' ? '' : currentNode} */}
              <span
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(event) => {
                  event.stopPropagation();
                  dispatchAction(data);
                }}
              >
                <SolidIcon name={iconName} fill="var(--icon-strong)" width={width} height={height} />
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
      className={cx('d-flex position-absolute', { 'show-menu': showMenu })}
    >
      {renderOptions()}
      <OverlayTrigger
        trigger={'click'}
        placement={'bottom-end'}
        rootClose={false}
        show={showMenu}
        overlay={
          <Popover className={cx('copy-menu-options', { 'dark-theme': darkMode })} onClick={(e) => e.stopPropagation()}>
            <Popover.Body bsPrefix="popover-body">
              <div className="menu-options mb-0">
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    copyPath();
                    closeMenu();
                  }}
                  className="option"
                  data-cy="inspector-copy-path"
                >
                  <DefaultCopyIcon height={16} width={16} fill="var(--icon-weak)" />

                  <span> Copy path</span>
                </div>
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    copyValue();
                    closeMenu();
                  }}
                  className="option"
                  data-cy="inspector-copy-value"
                >
                  <SolidIcon width="16" height="16" name="copy" fill="var(--icon-weak)" />
                  <span> Copy value</span>
                </div>
              </div>
            </Popover.Body>
          </Popover>
        }
      >
        <div
          className="node-action-icon"
          style={{
            outline: 'none',
            ...(showMenu && { backgroundColor: 'var(--button-outline-pressed, rgba(136, 144, 153, 0.18)' }),
          }}
        >
          <ToolTip message="Copy options" trigger={['hover', 'focus']}>
            <span
              onClick={(event) => {
                event.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <SolidIcon fill="var(--icon-strong)" width="12" height="12" name="copy" />
            </span>
          </ToolTip>
        </div>
      </OverlayTrigger>
    </div>
  );
};
