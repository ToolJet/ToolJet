import React from 'react';
import _ from 'lodash';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import JSONNodeObject from './JSONNodeObject';
import JSONNodeArray from './JSONNodeArray';
import JSONNodeValue from './JSONNodeValue';
import JSONNodeIndicator from './JSONNodeIndicator';
import JSONNodeMap from './JSONNodeMap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { copyToClipboard } from '@/_helpers/appUtils';
import useStore from '@/AppBuilder/_stores/store';

export const JSONNode = ({ data, ...restProps }) => {
  const {
    path,
    shouldExpandNode,
    currentNode,
    selectedNode,
    getCurrentPath,
    getCurrentNodeType,
    getLength,
    toUseNodeIcons,
    renderNodeIcons,
    useIndentedBlock,
    updateSelectedNode,
    useActions,
    enableCopyToClipboard,
    getNodeShowHideComponents,
    expandWithLabels,
    getAbsoluteNodePath,
    actionsList,
    fontSize,
    inspectorTree,
    renderCurrentNodeInfoIcon,
    debuggerTree,
  } = restProps;
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);
  const pathToBeInspected = useStore((state) => state.pathToBeInspected);

  const [expandable, set] = React.useState(() =>
    typeof shouldExpandNode === 'function' ? shouldExpandNode(path, data) : shouldExpandNode
  );

  const [showHiddenOptionButtons, setShowHiddenOptionButtons] = React.useState([]);

  React.useEffect(() => {
    if (showHiddenOptionButtons) {
      setShowHiddenOptionButtons(() => getNodeShowHideComponents(currentNode, path));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (typeof shouldExpandNode === 'function') {
      set(shouldExpandNode(path, data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathToBeInspected]);

  const toggleExpandNode = (node) => {
    if (expandable) {
      updateSelectedNode(null);
    } else {
      updateSelectedNode(node, path);
    }

    set((prev) => !prev);
  };

  const onSelect = (data, currentNode, path) => {
    if (currentNode === 'componentId' && data && debuggerTree) {
      setSelectedComponents([data]);
    } else if (inspectorTree && data && path.length === 2 && path[0] === 'components' && data?.id) {
      setSelectedComponents([data.id]);
    }
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
  let $NODEInfoIcon = null;

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

  if (toUseNodeIcons && currentNode) {
    $NODEIcon = renderNodeIcons(currentNode);
    $NODEInfoIcon = renderCurrentNodeInfoIcon(currentNode);
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
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'entries' : 'entry'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );
      break;

    case 'Array':
      $VALUE = <JSONNodeArray data={data} path={currentNodePath} {...restProps} />;
      $NODEType = (
        <JSONNode.DisplayNodeLabel type={'Array'}>
          <span className="mx-1 fs-9 node-length-color">
            {`${numberOfEntries} ${numberOfEntries > 1 ? 'items' : 'item'}`}{' '}
          </span>
        </JSONNode.DisplayNodeLabel>
      );

      break;

    case 'Map':
      $VALUE = <JSONNodeMap data={data} path={currentNodePath} {...restProps} />;
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
      onClick={() => {
        const shouldTriggerActions = debuggerTree && currentNode === 'componentId';

        if (toExpandNode || shouldTriggerActions) {
          handleOnClickLabels(data, currentNode, path);
        }
      }}
      style={{ marginTop: '1px', cursor: 'pointer', textTransform: 'none', fontSize: fontSize }}
      className={cx('node-key mx-0 badge badge-outline hovered-json-node', {
        'color-primary': applySelectedNodeStyles,
        'node-key-outline': !applySelectedNodeStyles,
        'hovered-json-node-border': applySelectedNodeStyles,
      })}
    >
      {String(currentNode).length > 23 ? (
        <ToolTip message={String(currentNode)}>
          <span>{`${String(currentNode).substring(0, 23)}...`}</span>
        </ToolTip>
      ) : (
        String(currentNode)
      )}
    </span>
  );

  if (!currentNode) {
    return $VALUE;
  }

  const shouldDisplayIntendedBlock =
    useIndentedBlock &&
    expandable &&
    (typeofCurrentNode === 'Object' || typeofCurrentNode === 'Array' || typeofCurrentNode === 'Map');

  const DefaultCopyIcon = () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-cy="copy-path-to-clipboard"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.3113 4.68871C18.5834 3.9609 17.4034 3.9609 16.6757 4.68871L15.8421 5.5223C15.4237 5.94071 14.7453 5.94071 14.3269 5.5223C13.9084 5.10389 13.9084 4.42549 14.3269 4.00707L15.1605 3.17348C16.7251 1.60884 19.2619 1.60884 20.8266 3.17348C22.3911 4.73811 22.3911 7.2749 20.8266 8.83954L19.9929 9.67313C19.5746 10.0916 18.8961 10.0916 18.4777 9.67313C18.0593 9.25471 18.0593 8.57633 18.4777 8.1579L19.3113 7.32431C20.0391 6.59651 20.0391 5.41651 19.3113 4.68871ZM17.406 6.59394C17.8244 7.01236 17.8244 7.69074 17.406 8.10917L15.1982 10.317C14.7798 10.7354 14.1014 10.7354 13.683 10.317C13.2645 9.89856 13.2645 9.22017 13.683 8.80174L15.8908 6.59394C16.3091 6.17551 16.9876 6.17551 17.406 6.59394ZM12.6651 7.184C13.0835 7.60241 13.0835 8.28081 12.6651 8.69923L11.8315 9.53283C11.1037 10.2606 11.1037 11.4406 11.8315 12.1684C12.5593 12.8962 13.7393 12.8962 14.4671 12.1684L15.3007 11.3348C15.7191 10.9164 16.3974 10.9164 16.8159 11.3348C17.2343 11.7533 17.2343 12.4316 16.8159 12.8501L15.9823 13.6837C14.4177 15.2483 11.8809 15.2483 10.3162 13.6837C8.75161 12.119 8.75161 9.58223 10.3162 8.0176L11.1498 7.184C11.5683 6.76559 12.2467 6.76559 12.6651 7.184ZM17.245 14.9463C14.983 17.2083 11.3156 17.2083 9.05356 14.9463C6.79156 12.6843 6.79156 9.01691 9.05356 6.7549L9.52276 6.28571H4.14286C2.95939 6.28571 2 7.2451 2 8.42857V19.8571C2 21.0406 2.95939 22 4.14286 22H15.5714C16.7549 22 17.7143 21.0406 17.7143 19.8571V14.4771L17.245 14.9463Z"
        fill={'#C1C8CD'}
      />
    </svg>
  );

  const renderHiddenOptionsForNode = () => {
    const moreActions = actionsList.filter((action) => action.for === 'all')[0];

    const renderOptions = () => {
      if (!useActions || showHiddenOptionButtons?.length === 0) return null;

      return showHiddenOptionButtons?.map((actionOption, index) => {
        const { name, icon, src, iconName, dispatchAction, width = 12, height = 12 } = actionOption;
        if (icon) {
          return (
            <ToolTip key={`${name}-${index}`} message={`${name} ${name === 'Go to component' ? '' : currentNode}`}>
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
      <div style={{ fontSize: '9px', marginTop: '0px', right: '10px' }} className="d-flex position-absolute">
        {enableCopyToClipboard && (
          <ToolTip message={'Copy to clipboard'}>
            <span
              onClick={() => {
                copyToClipboard(getAbsoluteNodePath(currentNodePath));
              }}
              style={{ height: '13px', width: '13px', marginBottom: '4px' }}
              className="mx-1 copy-to-clipboard"
            >
              <DefaultCopyIcon />
            </span>
          </ToolTip>
        )}
        <ToolTip message={'Copy value'}>
          <span
            onClick={() => {
              moreActions['actions'][0].dispatchAction(data, currentNode);
            }}
            data-cy={`copy-value-to-clicpboard`}
          >
            <SolidIcon width="12" height="12" name="copy" />
          </span>
        </ToolTip>
        {renderOptions()}
      </div>
    );
  };

  return (
    <div
      className={cx('d-flex row-flex mt-1 container-fluid px-1', {
        'json-node-element': !expandable,
      })}
    >
      {(inspectorTree || toShowNodeIndicator) && (
        <div
          className={cx('json-tree-icon-container', {
            'mx-2': !$NODEInfoIcon,
            'm-0': $NODEInfoIcon,
            'selected-node': applySelectedNodeStyles,
          })}
        >
          {$NODEInfoIcon && $NODEInfoIcon}
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
          className={cx('d-flex inspector-json-node', {
            'group-object-container': shouldDisplayIntendedBlock,
            'mx-2': typeofCurrentNode !== 'Object' && typeofCurrentNode !== 'Array',
          })}
          data-cy={`inspector-node-${String(currentNode).toLowerCase()}`}
        >
          {$NODEIcon && <div className="json-tree-icon-container">{$NODEIcon}</div>}
          {$key} {$NODEType}
          {!toExpandNode && !toRenderSelector ? $VALUE : null}
          <div className="action-icons-group">{useActions && renderHiddenOptionsForNode()}</div>
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
