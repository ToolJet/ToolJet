import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import CopyToClipboardComponent from '@/_components/CopyToClipboard';
import { Popover } from 'react-bootstrap';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import JSONNodeObject from './JSONNodeObject';
import JSONNodeArray from './JSONNodeArray';
import JSONNodeValue from './JSONNodeValue';
import JSONNodeIndicator from './JSONNodeIndicator';
import JSONNodeMap from './JSONNodeMap';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
    actionsList,
    fontSize,
    inspectorTree,
  } = restProps;

  const [expandable, set] = React.useState(() =>
    typeof shouldExpandNode === 'function' ? shouldExpandNode(path, data) : shouldExpandNode
  );

  const [showHiddenOptionsForNode, setShowHiddenOptionsForNode] = React.useState(false);
  const [showHiddenOptionButtons, setShowHiddenOptionButtons] = React.useState([]);

  React.useEffect(() => {
    if (showHiddenOptionButtons) {
      setShowHiddenOptionButtons(() => getNodeShowHideComponents(currentNode, path));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpandNode = (node) => {
    if (expandable) {
      updateSelectedNode(null);
    } else {
      updateSelectedNode(node, path);
    }

    set((prev) => !prev);
  };

  const onSelect = (data, currentNode, path) => {
    const actions = getOnSelectLabelDispatchActions(currentNode, path)?.filter((action) => action.onSelect);
    actions.forEach((action) => action.dispatchAction(data, currentNode));

    if (!expandWithLabels) {
      updateSelectedNode(currentNode, path);
      set(true);
    }
  };

  const handleOnClickLabels = (data, currentNode, path) => {
    if (expandWithLabels) {
      toggleExpandNode(currentNode);
    }

    if (useActions) {
      onSelect(data, currentNode, path);
    }
  };

  const typeofCurrentNode = getCurrentNodeType(data);
  const currentNodePath = getCurrentPath(path, currentNode);
  const toExpandNode = (data instanceof Array || data instanceof Object) && !_.isEmpty(data);
  const toShowNodeIndicator =
    (typeofCurrentNode === 'Array' || typeofCurrentNode === 'Object' || typeofCurrentNode === 'Map') &&
    typeofCurrentNode !== 'Function';
  const numberOfEntries = getLength(typeofCurrentNode, data);
  const toRenderSelector =
    (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array' || typeofCurrentNode === 'Map') &&
    numberOfEntries > 0;

  let $VALUE = null;
  let $NODEType = null;
  let $NODEIcon = null;

  const checkSelectedNode = (_selectedNode, _currentNode, parent, toExpand) => {
    if (selectedNode?.parent && parent) {
      return _selectedNode.parent === parent && _selectedNode?.node === _currentNode && toExpand;
    }

    return toExpand && _selectedNode?.node === _currentNode;
  };

  const parent = path && typeof path?.length === 'number' ? path[path.length - 2] : null;

  const applySelectedNodeStyles = toExpandNode
    ? checkSelectedNode(selectedNode, currentNode, parent, expandable)
    : false;

  React.useEffect(() => {
    if (!expandable) {
      updateSelectedNode(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandable]);

  React.useEffect(() => {
    if (selectedNode?.node === currentNode) {
      set(true);
    }
  }, [selectedNode, currentNode]);

  React.useEffect(() => {
    if (hoveredNode?.node === currentNode && hoveredNode?.parent === parent) {
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
    case 'Date':
      $VALUE = <JSONNodeValue data={data} type={typeofCurrentNode} />;
      $NODEType = <JSONNode.DisplayNodeLabel type={typeofCurrentNode} />;
      break;

    case 'Object':
      $VALUE = <JSONNodeObject data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Object'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'entries' : 'entry'}`}
          </span>
        </JSONNode.DisplayNodeLabel>
      );
      break;

    case 'Array':
      $VALUE = <JSONNodeArray data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Array'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'items' : 'item'}`}
          </span>
        </JSONNode.DisplayNodeLabel>
      );

      break;

    case 'Map':
      $VALUE = <JSONNodeMap data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Array'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'items' : 'item'}`}
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
      onClick={() => toExpandNode && handleOnClickLabels(data, currentNode, path)}
      style={{ marginTop: '1px', cursor: 'pointer', textTransform: 'none', fontSize: fontSize }}
      className={cx('node-key mx-0 badge badge-outline', {
        'color-primary': applySelectedNodeStyles && !showHiddenOptionsForNode,
        'hovered-node': showHiddenOptionsForNode,
        'node-key-outline': !applySelectedNodeStyles && !showHiddenOptionsForNode,
      })}
    >
      {String(currentNode)}
    </span>
  );

  if (!currentNode) {
    return $VALUE;
  }

  const shouldDisplayIntendedBlock =
    useIndentedBlock &&
    expandable &&
    (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array' || typeofCurrentNode === 'Map');

  function moreActionsPopover(actions) {
    //Todo: For adding more actions to the menu popover!
    const darkMode = localStorage.getItem('darkMode') === 'true';

    return (
      <Popover
        id="popover-basic popover-positioned-right json-tree-popover"
        style={{ maxWidth: '350px', padding: '0px' }}
        className={`shadow ${darkMode && 'popover-dark-themed theme-dark'}`}
      >
        <div className="list-group">
          {actions?.map((action, index) => (
            <span
              key={index}
              type="button"
              className="list-group-item list-group-item-action popover-more-actions"
              aria-current="true"
              onClick={() => {
                action.dispatchAction(data, currentNode);
              }}
            >
              {action.name}
            </span>
          ))}
        </div>
      </Popover>
    );
  }

  const renderHiddenOptionsForNode = () => {
    const moreActions = actionsList.filter((action) => action.for === 'all')[0];

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
                <img src={src ?? `assets/images/icons/${iconName}.svg`} width={width} height={height} />
              </span>
            </ToolTip>
          );
        }
      });
    };

    return (
      <div style={{ fontSize: '9px', marginTop: '0px' }} className="d-flex end-0 position-absolute">
        {enableCopyToClipboard && (
          <CopyToClipboardComponent data={currentNodePath} path={true} callback={getAbsoluteNodePath} />
        )}
        {renderOptions()}

        {moreActions.actions?.length > 0 && (
          <OverlayTrigger
            rootClose={true}
            rootCloseEvent="mousedown"
            trigger="click"
            placement={'right'}
            overlay={moreActionsPopover(moreActions?.actions)}
          >
            <span>
              <ToolTip message={'More actions'}>
                <SolidIcon width="13" name="morevertical" />
              </ToolTip>
            </span>
          </OverlayTrigger>
        )}
      </div>
    );
  };

  return (
    <div
      className={cx('d-flex row-flex mt-1 container-fluid px-1', {
        'json-node-element': !expandable,
      })}
      onMouseLeave={() => updateHoveredNode(null)}
    >
      {(inspectorTree || toShowNodeIndicator) && (
        <div className={`json-tree-icon-container  mx-2 ${applySelectedNodeStyles && 'selected-node'}`}>
          <JSONNodeIndicator
            toExpand={expandable}
            toShowNodeIndicator={toShowNodeIndicator}
            handleToggle={toggleExpandNode}
            typeofCurrentNode={typeofCurrentNode}
            currentNode={currentNode}
            isSelected={selectedNode?.node === currentNode}
            toExpandNode={toExpandNode}
            data={data}
            path={currentNodePath}
            toExpandWithLabels={expandWithLabels}
            toggleWithLabels={handleOnClickLabels}
          />
        </div>
      )}

      <div
        style={{ width: 'inherit' }}
        className={`${shouldDisplayIntendedBlock && 'group-border'} ${applySelectedNodeStyles && 'selected-node'} `}
      >
        <div
          className={cx('d-flex', {
            'group-object-container': shouldDisplayIntendedBlock,
            'mx-2': typeofCurrentNode !== 'Object' && typeofCurrentNode !== 'Array',
          })}
          onMouseEnter={() => updateHoveredNode(currentNode, currentNodePath)}
          data-cy={`inspector-node-${String(currentNode).toLowerCase()}`}
        >
          {$NODEIcon && <div className="json-tree-icon-container">{$NODEIcon}</div>}
          {$key} {$NODEType}
          {!toExpandNode && !toRenderSelector ? $VALUE : null}
          <div className="action-icons-group">
            {useActions && showHiddenOptionsForNode && renderHiddenOptionsForNode()}
          </div>
        </div>
        {toRenderSelector && (toExpandNode && !expandable ? null : $VALUE)}
      </div>
    </div>
  );
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

JSONNode.DisplayNodeLabel = DisplayNodeLabel;
