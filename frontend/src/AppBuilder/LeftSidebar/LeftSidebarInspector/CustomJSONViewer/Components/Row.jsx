import React, { useState } from 'react';
import { Copy, Link2 } from 'lucide-react';
import StringNode from './StringNode';
import FunctionNode from './FunctionNode';
import NumberNode from './NumberNode';
import BooleanNode from './BooleanNode';
import NullNode from './NullNode';
import ArrayNode from './ArrayNode';
import ObjectNode from './ObjectNode';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { ToolTip } from '@/_components/ToolTip';
import { copyToClipboard, extractComponentName, formatPathForCopy } from '../../utils';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

const renderNodeIcons = (node, iconsList, darkMode) => {
  const icon = iconsList.filter((icon) => icon?.iconName === node)[0];

  if (icon && icon.jsx) {
    if (icon?.tooltipMessage) {
      return (
        <ToolTip message={icon?.tooltipMessage}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{icon.jsx({ height: 14, width: 14 })}</div>
        </ToolTip>
      );
    }
    return icon.jsx({ height: 14, width: 14 });
  }
  return null;
};

const Row = ({ label, value, level = 1, absolutePath, iconsList = [], darkMode, showPathCopy = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Node = () => {
    if (typeof value === 'string') {
      return <StringNode value={value} />;
    } else if (typeof value === 'undefined' || value === null) {
      return <NullNode value={value} />;
    } else if (typeof value === 'number') {
      return <NumberNode value={value} />;
    } else if (typeof value === 'boolean') {
      return <BooleanNode value={value} />;
    } else if (Array.isArray(value)) {
      return <ArrayNode value={value} />;
    } else if (typeof value === 'object') {
      return <ObjectNode value={value} />;
    } else if (typeof value === 'function') {
      return <FunctionNode />;
    }
  };

  const isObject = typeof value === 'object' && !Array.isArray(value) && value !== null;
  const isArray = Array.isArray(value);

  return (
    <div style={{ marginLeft: `${level === 1 ? '0px' : '0.5rem'}` }}>
      <div className="json-viewer-row-container">
        <div className="json-viewer-row" onClick={() => setIsExpanded((prev) => !prev)}>
          <div className="json-viewer-expand-icon">
            {(isArray || isObject) &&
              (isExpanded ? (
                <SolidIcon
                  name="TriangleUpCenter"
                  size={14}
                  color="#1F99ED"
                  style={{ marginRight: '4px' }}
                  className="json-viewer-expand-icon"
                />
              ) : (
                <SolidIcon
                  name="rightarrrow"
                  size={12}
                  color="#1F99ED"
                  style={{ marginRight: '4px' }}
                  className="json-viewer-expand-icon"
                />
              ))}
          </div>
          <div
            className="json-viewer-label-container"
            data-cy={`inspector-${generateCypressDataCy(label || '')}-label`}
          >
            <OverflowTooltip style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              {renderNodeIcons(label, iconsList, darkMode)}
              {label}
            </OverflowTooltip>
          </div>
          <div
            className="json-viewer-value-container"
            data-cy={`inspector-${generateCypressDataCy(label || '')}-value`}
          >
            <Node />
          </div>
          <div className="json-viewer-actions-container">
            {showPathCopy && (
              <ToolTip message={'Copy path'}>
                <button
                  type="button"
                  aria-label={`Copy path of ${label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    copyToClipboard(formatPathForCopy(absolutePath), false);
                  }}
                  className="copy-to-clipboard json-viewer-action-icon"
                >
                  <Link2 size={12} />
                </button>
              </ToolTip>
            )}
            <ToolTip message={'Copy value'}>
              <button
                type="button"
                aria-label={`Copy value of ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  copyToClipboard(value);
                }}
                className="json-viewer-action-icon"
              >
                <Copy size={12} />
              </button>
            </ToolTip>
          </div>
        </div>
      </div>
      {isExpanded && isObject && (
        <div className="json-viewer-children" style={{ marginLeft: '5px', borderLeft: '1px solid var(--border-weak)' }}>
          {Object.entries(value).map(([key, val]) => (
            <Row
              key={key}
              label={key}
              value={val}
              level={level + 1}
              absolutePath={`${absolutePath}.${key}`}
              iconsList={iconsList}
              darkMode={darkMode}
              showPathCopy={showPathCopy}
            />
          ))}
        </div>
      )}
      {isExpanded && isArray && (
        <div className="json-viewer-children" style={{ marginLeft: '5px', borderLeft: '1px solid var(--border-weak)' }}>
          {value.map((item, index) => {
            return (
              <Row
                key={index}
                label={`${index}`}
                value={item}
                level={level + 1}
                absolutePath={`${absolutePath}.${index}`}
                iconsList={iconsList}
                darkMode={darkMode}
                showPathCopy={showPathCopy}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Row;
