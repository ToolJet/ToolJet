import React, { useMemo, useState } from 'react';
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
import { DefaultCopyIcon } from '../../DefaultCopyIcon';
import { copyToClipboard, extractComponentName, formatPathForCopy } from '../../utils';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { childGroups } from '@/AppBuilder/_engines/rendering/childGroups';
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

const ExpandIcon = ({ isExpanded }) =>
  isExpanded ? (
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
  );

const Row = ({ label, value, level = 1, absolutePath, iconsList, darkMode }) => {
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
            {(isArray || isObject) && <ExpandIcon isExpanded={isExpanded} />}
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
            <ToolTip message={'Copy path'}>
              <span
                onClick={() => {
                  const formattedPath = formatPathForCopy(absolutePath);
                  copyToClipboard(formattedPath, false);
                }}
                className="copy-to-clipboard json-viewer-action-icon"
              >
                <DefaultCopyIcon height={12} width={12} />
              </span>
            </ToolTip>
            <ToolTip message={'Copy value'}>
              <span
                onClick={() => {
                  copyToClipboard(value);
                }}
                className="json-viewer-action-icon"
              >
                <SolidIcon width="12" height="12" name="copy" fill="#6A727C" />
              </span>
            </ToolTip>
          </div>
        </div>
      </div>
      {isExpanded && (isObject || isArray) && (
        <Entries
          value={value}
          isArray={isArray}
          level={level}
          absolutePath={absolutePath}
          iconsList={iconsList}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

// The entries of an opened array or object. A large one is listed in groups opened on demand (childGroups), so
// opening a 5-million-row dataset renders a handful of rows, not millions.
const Entries = ({ value, isArray, level, absolutePath, iconsList, darkMode }) => {
  const keys = useMemo(() => (isArray ? null : Object.keys(value)), [value, isArray]);
  const count = isArray ? value.length : keys.length;
  return (
    <EntryRange
      value={value}
      keys={keys}
      from={0}
      to={count - 1}
      level={level}
      absolutePath={absolutePath}
      iconsList={iconsList}
      darkMode={darkMode}
    />
  );
};

const childrenStyle = { marginLeft: '5px', borderLeft: '1px solid var(--border-weak)' };

const EntryRange = ({ value, keys, from, to, level, absolutePath, iconsList, darkMode }) => {
  const groups = childGroups(from, to);
  if (groups) {
    return (
      <div className="json-viewer-children" style={childrenStyle}>
        {groups.map((group) => (
          <EntryGroup
            key={group.from}
            {...group}
            value={value}
            keys={keys}
            level={level + 1}
            absolutePath={absolutePath}
            iconsList={iconsList}
            darkMode={darkMode}
          />
        ))}
      </div>
    );
  }
  const rows = [];
  for (let i = from; i <= to; i++) {
    const key = keys ? keys[i] : `${i}`;
    rows.push(
      <Row
        key={key}
        label={key}
        value={value[key]}
        level={level + 1}
        absolutePath={`${absolutePath}.${key}`}
        iconsList={iconsList}
        darkMode={darkMode}
      />
    );
  }
  return (
    <div className="json-viewer-children" style={childrenStyle}>
      {rows}
    </div>
  );
};

const EntryGroup = ({ from, to, value, keys, level, absolutePath, iconsList, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div style={{ marginLeft: '0.5rem' }}>
      <div className="json-viewer-row-container">
        <div className="json-viewer-row" onClick={() => setIsExpanded((prev) => !prev)} data-cy="inspector-entry-group">
          <div className="json-viewer-expand-icon">
            <ExpandIcon isExpanded={isExpanded} />
          </div>
          <div className="json-viewer-label-container">{`[${from} … ${to}]`}</div>
        </div>
      </div>
      {isExpanded && (
        <EntryRange
          value={value}
          keys={keys}
          from={from}
          to={to}
          level={level}
          absolutePath={absolutePath}
          iconsList={iconsList}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default Row;
