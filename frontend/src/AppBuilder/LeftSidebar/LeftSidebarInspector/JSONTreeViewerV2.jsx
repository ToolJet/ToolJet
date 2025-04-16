import React from 'react';
import TreeView, { flattenTree } from 'react-accessible-treeview';
import WidgetIcon from '@/../assets/images/icons/widgets';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import { extractComponentName } from './utils';

const JSONTreeViewerV2 = ({ data = {}, iconsList = [], darkMode, callbackActions = [] }) => {
  const flattendedData = flattenTree(data);

  const renderNodeIcons = (node) => {
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

  return (
    <TreeView
      data={flattendedData}
      className="basic"
      aria-label="basic example tree"
      nodeRenderer={(props) => {
        const { element, getNodeProps, level, handleSelect, handleExpand, isExpanded, isDisabled, isBranch } = props;
        const nodeIcon = renderNodeIcons(element.name);
        const metadata = element.metadata || {};
        const { type } = metadata;

        const actions = callbackActions.filter((action) => [type, 'all'].includes(action.for));

        return (
          <div
            {...getNodeProps({ onClick: handleExpand })}
            style={{
              marginLeft: 22 * (level - 1),
              opacity: isDisabled ? 0.5 : 1,
              height: level === 1 ? '28px' : '32px',
              display: 'flex',
              alignItems: 'center',
              color: level === 1 ? 'var(--text-placeholder, #6A727C)' : 'var(--text-default, #1B1F24)',
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
            {nodeIcon && <div className="node-icon">{nodeIcon}</div>}
            <div className="node-label">
              <span className="name">{element.name}</span>
            </div>
          </div>
        );
      }}
    />
  );
};

export default JSONTreeViewerV2;
