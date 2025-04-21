import React, { useState } from 'react';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { extractComponentName } from './utils';
import { ToolTip } from '@/_components/ToolTip';
import Highlighter from 'react-highlight-words';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { HiddenOptions } from './HiddenOptions';
import useCallbackActions from './useCallbackActions';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const renderNodeIcons = (node, iconsList, darkMode) => {
  const icon = iconsList.filter((icon) => icon?.iconName === node && !icon?.isInfoIcon)[0];
  if (icon && icon?.iconPath) {
    return (
      <WidgetIcon
        name={extractComponentName(icon?.iconPath)}
        fill={darkMode ? '#3A3F42' : '#D7DBDF'}
        width="16"
        height="16"
      />
    );
  }
  if (icon && icon.jsx) {
    if (icon?.tooltipMessage) {
      return (
        <ToolTip message={icon?.tooltipMessage}>
          <div>{icon.jsx()}</div>
        </ToolTip>
      );
    }
    return icon.jsx();
  }
};

export const Node = (props) => {
  const {
    element,
    getNodeProps,
    level,
    handleSelect,
    handleExpand,
    isExpanded,
    isDisabled,
    isBranch,
    darkMode,
    setSelectedNodePath,
    searchValue,
    iconsList,
    data,
  } = props;

  const [actionClicked, setActionClicked] = useState(false);
  const setSelectedNodes = useStore((state) => state.setSelectedNodes, shallow);
  const callbackActions = useCallbackActions() || [];
  const nodeIcon = renderNodeIcons(element.name, iconsList, darkMode);
  const metadata = element.metadata || {};
  const { type } = metadata;
  const nodeSpecificActions = callbackActions.filter((action) => [type].includes(action.for));
  const onSelect = (node) => {
    const { isBranch, element } = node || {};
    const { metadata } = element || {};
    const { path } = metadata || {};
    if (!isBranch) {
      setSelectedNodePath(path);
    } else {
      setSelectedNodePath(null);
    }

    setSelectedNodes(path);
  };
  const nodeSpecificFilteredActions =
    nodeSpecificActions?.[0]?.actions?.filter((action) => {
      return action.enableInspectorTreeView;
    }) || [];

  const generalActions = callbackActions.filter((action) => action.for === 'all');
  const generalActionsFiltered = generalActions?.[0]?.actions?.filter((action) => {
    return action.enableInspectorTreeView;
  });

  return (
    // <div {...getNodeProps({ onClick: handleExpand })}>
    <div
      onClick={() => onSelect(props)}
      style={{
        marginLeft: 22 * (level - 1),
        opacity: isDisabled ? 0.5 : 1,
        height: level === 1 ? '28px' : '32px',
        display: 'flex',
        alignItems: 'center',
        color: level === 1 ? 'var(--text-placeholder, #6A727C)' : 'var(--text-default, #1B1F24)',
        cursor: isBranch || level === 1 ? 'pointer' : 'default',
      }}
    >
      {(isBranch || level === 1) && (
        <div className="node-expansion-icon">
          {isExpanded ? (
            <SolidIcon name="TriangleDownCenter" width="16" height="16" />
          ) : (
            <SolidIcon name="TriangleUpCenter" width="16" height="16" />
          )}
        </div>
      )}
      <div
        className={cx('node-content', {
          'node-content-hoverable': level !== 1,
          'node-content-active': actionClicked,
        })}
      >
        {nodeIcon && <div className="node-icon">{nodeIcon}</div>}
        <div className="node-label">
          <OverflowTooltip whiteSpace="normal" placement="top" style={{ height: '100%', width: '190px' }}>
            <Highlighter
              highlightClassName="node-highlight"
              searchWords={[searchValue]}
              autoEscape={true}
              textToHighlight={element.name}
            />
          </OverflowTooltip>
        </div>
        <div className="node-actions">
          <HiddenOptions
            nodeSpecificFilteredActions={nodeSpecificFilteredActions}
            generalActionsFiltered={generalActionsFiltered}
            setActionClicked={setActionClicked}
            data={data}
          />
        </div>
      </div>
    </div>
    // </div>
  );
};
