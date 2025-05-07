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
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { shallow } from 'zustand/shallow';

const renderNodeIcons = (node, iconsList, darkMode) => {
  const icon = iconsList.filter((icon) => icon?.iconName === node && !icon?.isInfoIcon)[0];
  if (icon && icon?.iconPath) {
    return (
      <WidgetIcon
        name={extractComponentName(icon?.iconPath)}
        fill={darkMode ? '#3A3F42' : '#D7DBDF'}
        width="14"
        height="14"
      />
    );
  }

  if (icon && icon.jsx) {
    if (icon?.tooltipMessage) {
      return (
        <ToolTip message={icon?.tooltipMessage}>
          <div>{icon.jsx({ height: 14, width: 14 })}</div>
        </ToolTip>
      );
    }
    return icon.jsx({ height: 14, width: 14 });
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
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const metadata = element.metadata || {};
  const { type, path } = metadata;
  const nodeSpecificActions = callbackActions.filter((action) => [type].includes(action.for));
  const onExpand = (node) => {
    const { element } = node || {};
    const { metadata } = element || {};
    const { path } = metadata || {};
    setSelectedNodes(path);
  };

  const onSelect = (node) => {
    const { isBranch, element } = node || {};
    const { metadata } = element || {};
    const { path, type } = metadata || {};
    if (type) {
      setSelectedNodePath(path);
    }
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
      style={{
        // marginLeft: level > 1 ? 12 : 0,
        // paddingLeft: '16px',
        opacity: isDisabled ? 0.5 : 1,
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        color: level === 1 ? 'var(--text-placeholder, #6A727C)' : 'var(--text-default, #1B1F24)',
        fontWeight: level === 1 ? 500 : 400,
        // borderLeft: level > 1 ? '1px solid var(--slate6, #D7DBDF)' : 'none',
      }}
    >
      {/* {!['queries', 'globals', 'variables'].includes(type) && ( */}
      <div className="node-expansion-icon">
        {(isBranch || level === 1 || path === 'page.variables') && (
          <ButtonComponent
            iconOnly
            leadingIcon={isExpanded ? 'TriangleDownCenter' : 'rightarrrow'}
            onClick={() => onExpand(props)}
            variant="ghost"
            fill="var(--icon-default,#ACB2B9)"
            size="small"
          />
        )}
      </div>
      {/* )} */}

      <div
        onClick={() => onSelect(props)}
        className={cx('node-content', {
          'node-content-hoverable': level !== 1,
          'node-content-active': actionClicked,
        })}
      >
        {nodeIcon && <div className="node-icon">{nodeIcon}</div>}
        <div className="node-label">
          <OverflowTooltip whiteSpace="normal" placement="top" style={{ height: '100%', width: '80%' }}>
            <Highlighter
              highlightClassName="node-highlight"
              searchWords={[searchValue]}
              autoEscape={true}
              textToHighlight={element.name}
            />
          </OverflowTooltip>
        </div>
        <div className="node-actions" style={{ marginRight: 12 + nodeSpecificFilteredActions.length * 12 }}>
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
