import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components/ToolTip';

export const JSONNode = ({ data, ...restProps }) => {
  const {
    path,
    shouldExpandNode,
    currentNode,
    selectedNode,
    hoveredNode,
    getCurrentPath,
    getCurrentNodeType,
    getLength,
    toUseNodeIcons,
    renderNodeIcons,
    useIndentedBlock,
    updateSelectedNode,
    updateHoveredNode,
    useActions,
    enableCopyToClipboard,
    getNodeShowHideComponents,
    getOnSelectLabelDispatchActions,
    expandWithLabels,
    getAbsoluteNodePath,
  } = restProps;

  const [expandable, set] = React.useState(() =>
    typeof shouldExpandNode === 'function' ? shouldExpandNode(path, data) : shouldExpandNode
  );

  const [showHiddenOptionsForNode, setShowHiddenOptionsForNode] = React.useState(false);
  const [showHiddenOptionButtons, setShowHiddenOptionButtons] = React.useState([]);
  const [onSelectDispatchActions, setOnSelectDispatchActions] = React.useState([]);

  React.useEffect(() => {
    if (showHiddenOptionButtons) {
      setShowHiddenOptionButtons(() => getNodeShowHideComponents(currentNode, path));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (useActions && currentNode) {
      const onSelectDispatchActions = getOnSelectLabelDispatchActions(currentNode, path).filter(
        (action) => action.onSelect
      );
      if (onSelectDispatchActions.length > 0) {
        setOnSelectDispatchActions(onSelectDispatchActions);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode]);

  const toggleExpandNode = (node) => {
    if (expandable) {
      updateSelectedNode(null);
    } else {
      updateSelectedNode(node);
    }

    set((prev) => !prev);
  };

  const onSelect = (data, currentNode) => {
    const actions = onSelectDispatchActions;
    actions.forEach((action) => action.dispatchAction(data, currentNode));

    if (!expandWithLabels) {
      updateSelectedNode(currentNode);
      set(true);
    }
  };

  const handleOnClickLabels = (data, currentNode) => {
    if (expandWithLabels) {
      toggleExpandNode(currentNode);
    }

    if (useActions) {
      onSelect(data, currentNode);
    }
  };

  const typeofCurrentNode = getCurrentNodeType(data);
  const currentNodePath = getCurrentPath(path, currentNode);
  const toExpandNode = (data instanceof Array || data instanceof Object) && !_.isEmpty(data);
  const toShowNodeIndicator = (data instanceof Array || data instanceof Object) && typeofCurrentNode !== 'Function';
  const numberOfEntries = getLength(typeofCurrentNode, data);
  const toRenderSelector = (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array') && numberOfEntries > 0;

  let $VALUE = null;
  let $NODEType = null;
  let $NODEIcon = null;

  const selectedNodeStyles = expandable && selectedNode === currentNode;

  React.useEffect(() => {
    if (!expandable) {
      updateSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandable]);

  React.useEffect(() => {
    if (selectedNode === currentNode) {
      set(true);
    }
  }, [selectedNode, currentNode]);

  React.useEffect(() => {
    if (hoveredNode === currentNode) {
      setShowHiddenOptionsForNode(true);
    }

    return () => {
      setShowHiddenOptionsForNode(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredNode]);

  if (toUseNodeIcons && currentNode) {
    $NODEIcon = renderNodeIcons(currentNode);
  }

  switch (typeofCurrentNode) {
    case 'String':
    case 'Boolean':
    case 'Number':
    case 'Null':
    case 'Undefined':
    case 'Function':
      $VALUE = <JSONNode.ValueNode data={data} type={typeofCurrentNode} />;
      $NODEType = <JSONNode.DisplayNodeLabel type={typeofCurrentNode} />;
      break;

    case 'Object':
      $VALUE = <JSONNode.ObjectNode data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Object'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'entries' : 'entry'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );
      break;

    case 'Array':
      $VALUE = <JSONNode.ArrayNode data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Array'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'items' : 'item'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );

      break;

    default:
      $VALUE = <span>{String(data)}</span>;
      $NODEType = typeofCurrentNode;
  }

  let $key = (
    <span
      onClick={() => handleOnClickLabels(data, currentNode)}
      style={{ marginTop: '1px', cursor: 'pointer', textTransform: 'none' }}
      className={`node-key fs-12 fw-bold mx-1 ${
        expandable && selectedNode === currentNode && 'badge badge-outline color-primary'
      }`}
    >
      {String(currentNode)}
    </span>
  );

  if (!currentNode) {
    return $VALUE;
  }

  const shouldDisplayIntendedBlock =
    useIndentedBlock && expandable && (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array');

  const renderHiddenOptionsForNode = () => {
    const renderOptions = () => {
      if (!useActions || showHiddenOptionButtons?.length === 0) return null;

      return showHiddenOptionButtons?.map((actionOption, index) => {
        const { name, icon, src, iconName, dispatchAction, width = 12, height = 12 } = actionOption;
        if (icon) {
          return (
            <ToolTip key={`${name}-${index}`} message={`${name} ${currentNode}`}>
              <span
                style={{ height: '13px', width: '13px' }}
                className="mx-1"
                onClick={() => dispatchAction(data, currentNode)}
              >
                <img src={src ?? `/assets/images/icons/${iconName}.svg`} width={width} height={height} />
              </span>
            </ToolTip>
          );
        }
      });
    };

    return (
      <div
        style={{ fontSize: '9px', marginTop: expandable ? '0px' : '3px' }}
        className="d-flex end-0 position-absolute"
      >
        {enableCopyToClipboard && (
          <JSONNode.CopyToClipboard data={currentNodePath} path={true} callback={getAbsoluteNodePath} />
        )}
        {renderOptions()}
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon-tabler icon-tabler-dots-vertical"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="#2c3e50"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
            <circle cx="12" cy="5" r="1" />
          </svg>
        </span>
      </div>
    );
  };

  return (
    <div
      className={cx('d-flex row-flex mt-1 font-monospace container-fluid px-1', {
        'json-node-element': !expandable,
      })}
      onMouseEnter={() => updateHoveredNode(currentNode)}
      onMouseLeave={() => updateHoveredNode(null)}
    >
      <div className={`json-tree-icon-container  mx-2 ${selectedNodeStyles && 'selected-node'}`}>
        <JSONNode.NodeIndicator
          toExpand={expandable}
          toShowNodeIndicator={toShowNodeIndicator}
          handleToggle={toggleExpandNode}
          typeofCurrentNode={typeofCurrentNode}
          currentNode={currentNode}
          isSelected={selectedNode === currentNode}
        />
      </div>

      <div
        style={{ width: 'inherit' }}
        className={`${shouldDisplayIntendedBlock && 'group-border'} ${selectedNodeStyles && 'selected-node'}`}
      >
        <div
          className={cx('d-flex', {
            'group-object-container': shouldDisplayIntendedBlock,
            'mx-2': typeofCurrentNode !== 'Object' && typeofCurrentNode !== 'Array',
          })}
        >
          {$NODEIcon && <div className="ml-1 json-tree-icon-container">{$NODEIcon}</div>}
          {$key} {$NODEType}
          {!toExpandNode && !expandable && !toRenderSelector ? $VALUE : null}
          <div className="action-icons-group">{showHiddenOptionsForNode && renderHiddenOptionsForNode()}</div>
        </div>
        {toRenderSelector && (toExpandNode && !expandable ? null : $VALUE)}
      </div>
    </div>
  );
};

const JSONTreeNodeIndicator = ({ toExpand, toShowNodeIndicator, handleToggle, ...restProps }) => {
  const { renderCustomIndicator, typeofCurrentNode, currentNode, isSelected } = restProps;

  const defaultStyles = {
    transform: toExpand ? 'rotate(90deg)' : 'rotate(0deg)',
    transition: '0.2s all',
    display: 'inline-block',
    cursor: 'pointer',
  };

  const renderDefaultIndicator = () => (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.02063 1L5.01032 5.01028L1.00003 8.99997"
        stroke={`${toExpand && isSelected ? '#4D72FA' : '#61656F'}`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!toShowNodeIndicator && (typeofCurrentNode !== 'Object' || typeofCurrentNode !== 'Array')) return null;

  return (
    <React.Fragment>
      <span className="json-tree-node-icon" onClick={() => handleToggle(currentNode)} style={defaultStyles}>
        {renderCustomIndicator ? renderCustomIndicator() : renderDefaultIndicator()}
      </span>
    </React.Fragment>
  );
};

const JSONTreeValueNode = ({ data, type }) => {
  if (type === 'Function') {
    const functionString = `${data.toString().split('{')[0].trim()}{...}`;
    return (
      <React.Fragment>
        <span
          className={`text-secondary node-value-${type}`}
          style={{ fontSize: '12px', fontFamily: 'monospace', textTransform: 'none' }}
        >
          {functionString}
        </span>
      </React.Fragment>
    );
  }

  const value = type === 'String' ? `"${data}"` : String(data);
  const clsForUndefinedOrNull = (type === 'Undefined' || type === 'Null') && 'badge badge-secondary';
  return (
    <span
      className={`mx-2 json-tree-valuetype json-tree-node-${String(
        type
      ).toLowerCase()} text-break ${clsForUndefinedOrNull}`}
    >
      {value}
    </span>
  );
};

const JSONTreeObjectNode = ({ data, path, ...restProps }) => {
  const nodeKeys = Object.keys(data);

  return nodeKeys.map((key, index) => {
    const currentPath = [...path, key];
    const _currentNode = key;
    const props = { ...restProps };
    props.currentNode = _currentNode;

    return <JSONNode key={`obj-${key}/${index}`} data={data[key]} path={currentPath} {...props} />;
  });
};

const JSONTreeArrayNode = ({ data, path, ...restProps }) => {
  const keys = [];

  for (let i = 0; i < data.length; i++) {
    keys.push(String(i));
  }

  return keys.map((key, index) => {
    const currentPath = [...path, key];
    const _currentNode = key;
    const props = { ...restProps };
    props.currentNode = _currentNode;

    return <JSONNode key={`arr-${key}/${index}`} data={data[Number(key)]} path={currentPath} {...props} />;
  });
};

const DisplayNodeLabel = ({ type = '', children }) => {
  if (type === 'Null' || type === 'Undefined') {
    return null;
  }
  return (
    <>
      <span className="mx-1 fs-10 node-type">{type}</span>
      {children}
    </>
  );
};

const CopyToClipboardObject = ({ data, path = true, callback }) => {
  const [copied, setCopied] = React.useState(false);
  let dataToCopy = data;
  const message = path ? 'Path copied to clipboard' : 'Data copied to clipboard';
  const tip = path ? 'Copy path to clipboard' : 'Copy data to clipboard';

  if (path) {
    dataToCopy = callback(dataToCopy);
  } else {
    dataToCopy = JSON.stringify(dataToCopy, null, 2);
  }

  //clears the clipboard after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (copied) {
    return <center>Copied</center>;
  }

  dataToCopy = path ? dataToCopy : JSON.stringify(dataToCopy, null, 2);

  return (
    <ToolTip message={tip}>
      <CopyToClipboard
        text={dataToCopy}
        onCopy={() => {
          setCopied(true);
          toast.success(message, { position: 'top-center' });
        }}
      >
        <span style={{ height: '13px', width: '13px', marginBottom: '2px' }} className="mx-1 copy-to-clipboard">
          <img src={`/assets/images/icons/copy.svg`} width="12" height="12" />
        </span>
      </CopyToClipboard>
    </ToolTip>
  );
};

JSONNode.NodeIndicator = JSONTreeNodeIndicator;
JSONNode.ValueNode = JSONTreeValueNode;
JSONNode.ObjectNode = JSONTreeObjectNode;
JSONNode.ArrayNode = JSONTreeArrayNode;
JSONNode.DisplayNodeLabel = DisplayNodeLabel;
JSONNode.CopyToClipboard = CopyToClipboardObject;
