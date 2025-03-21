import { isEmpty, isEqual, get } from 'lodash';
import React from 'react';
import { JSONNode } from './JSONNode';
import ErrorBoundary from '@/Editor/ErrorBoundary';
import WidgetIcon from '@/../assets/images/icons/widgets';
import { ToolTip } from '@/_components/ToolTip';

export class JSONTreeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data,
      shouldExpandNode: false,
      currentNode: 'Root',
      selectedNode: null,
      hoveredNode: null,
      darkTheme: false,
      showHideActions: false,
      enableCopyToClipboard: props.enableCopyToClipboard ?? false,
      actionsList: props.actionsList || [],
      useActions: props.useActions ?? false,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevProps, this.props)) {
      this.setState({
        data: this.props.data,
        shouldExpandNode: this.props.shouldExpandNode,
        ...this.props,
      });
    }

    if (prevState.selectedComponent !== this.state.selectedComponent && this.props.treeType === 'inspector') {
      if (this.getCurrentNodeType(this.state.data) === 'Object') {
        const matchedWidget = Object.keys(this.state.data.components).filter(
          (component) => this.state.data.components[component].id === this.state.selectedComponent.id
        )[0];

        if (matchedWidget) {
          this.setState(
            {
              selectedWidget: matchedWidget,
            },
            () => {
              this.updateSelectedNode(matchedWidget);
            }
          );
        }
      }
    }
  }

  getCurrentNodePath(path, node) {
    let currentPath = path ?? [];
    if (node) {
      if (!currentPath[currentPath.length - 1] === node) {
        currentPath = [...currentPath, node];
      }
    }
    return currentPath;
  }

  getCurrentNodeType(node) {
    return Object.prototype.toString.call(node).slice(8, -1);
  }

  getLength(type, collection) {
    if (!collection) return 0;
    if (type === 'Object') {
      return Object.keys(collection).length;
    } else if (type === 'Array') {
      return collection.length;
    } else if (type === 'Map') {
      return collection.size;
    }

    return 0;
  }
  extractComponentName = (path) => {
    // Match the last part of the URL before ".svg" using a regular expression
    const match = path.match(/\/([^/]+)\.svg$/);

    if (match && match[1]) {
      return match[1]; // Return the matched component name
    } else {
      return null; // Return null if the pattern doesn't match
    }
  };

  renderNodeIcons = (node) => {
    const icon = this.props.iconsList.filter((icon) => icon?.iconName === node && !icon?.isInfoIcon)[0];
    if (icon && icon?.iconPath) {
      return (
        <WidgetIcon
          name={this.extractComponentName(icon?.iconPath)}
          fill={this.props.darkMode ? '#3A3F42' : '#D7DBDF'}
          width="16"
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

  renderCurrentNodeInfoIcon = (node) => {
    const icon = this.props.iconsList.filter((icon) => icon?.iconName === node)[0];
    if (icon?.isInfoIcon) {
      if (icon && icon?.iconPath) {
        return (
          <WidgetIcon
            name={this.extractComponentName(icon?.iconPath)}
            fill={this.props.darkMode ? '#3A3F42' : '#D7DBDF'}
            width="16"
          />
        );
      }
      if (icon && icon.jsx) {
        if (icon?.tooltipMessage) {
          return (
            <ToolTip message={icon?.tooltipMessage}>
              <div className="d-flex">{icon.jsx()}</div>
            </ToolTip>
          );
        }
        return icon.jsx();
      }
    } else return null;
  };

  updateSelectedNode = (node, path) => {
    if (node) {
      this.setState({
        selectedNode: { node: node, parent: path?.length ? path[path.length - 2] : null },
      });
    }
  };
  updateHoveredNode = (node, path) => {
    this.setState({
      hoveredNode: { node: node, parent: path?.length ? path[path.length - 2] : null },
    });
  };

  getDispatchActionsForNode = (node) => {
    if (!node) return null;
    return this.state.actionsList.filter((action) => action.for === node)[0];
  };

  getNodeShowHideComponents = (currentNode, path) => {
    const showHideComponents = [];
    const parent = path ? path[path.length - 2] : 'root';
    const dispatchActionForCurrentNode = this.getDispatchActionsForNode(parent);

    if (currentNode === parent) return;

    if (dispatchActionForCurrentNode && dispatchActionForCurrentNode['enableFor1stLevelChildren']) {
      dispatchActionForCurrentNode['actions'].map((action) => showHideComponents.push(action));
    }

    return showHideComponents;
    //Todo: if actions should be available for all children
  };

  getOnSelectLabelDispatchActions = (currentNode, path) => {
    const actions = [];
    let parent = path ? path[path.length - 2] : 'root';

    const nodeActions = this.props.treeType === 'debugger' && currentNode === 'componentId' ? 'all' : parent;

    const dispatchActionForCurrentNode = this.getDispatchActionsForNode(nodeActions);

    if (currentNode === parent) return;

    if (dispatchActionForCurrentNode && dispatchActionForCurrentNode['enableFor1stLevelChildren']) {
      dispatchActionForCurrentNode['actions'].map((action) => actions.push(action));
    }
    //Todo: if actions should be available for all children
    return actions;
  };

  getAbsoluteNodePath = (path) => {
    // const data = this.state.data;
    if (!this.state.data || isEmpty(this.state.data)) return null;
    // const map = new Map();

    // // loop through the data and build the map
    // const buildMap = (data, path = '') => {
    //   const keys = Object.keys(data);
    //   keys.forEach((key) => {
    //     const value = data[key];
    //     const _type = Object.prototype.toString.call(value).slice(8, -1);
    //     let newPath = '';
    //     if (path === '') {
    //       newPath = key;
    //     } else {
    //       newPath = `${path}.${key}`;
    //     }

    //     if (isObject(value) && ![window, window.app, document].includes(value)) {
    //       map.set(newPath, { type: _type });
    //       buildMap(value, newPath);
    //     } else {
    //       map.set(newPath, { type: _type });
    //     }
    //   });
    // };

    const computeAbsolutePath = (path) => {
      let prevPath, prevType, prevRelPath, currentPath, abs;

      for (let i = 0; i < path.length; i++) {
        const node = path[i];

        currentPath = prevRelPath ? `${prevRelPath}.${node}` : node;

        prevType = this.getCurrentNodeType(get(this.state.data, abs));
        if (prevType === 'Object') {
          //use bracket notation if the node starts with a numeric digit
          if (node.match(/^\d/)) {
            abs = `${prevPath}["${node}"]`;
          } else {
            abs = `${prevPath}.${node}`;
          }
        } else if (prevType === 'Array') {
          abs = `${prevPath}[${node}]`;
        } else {
          abs = currentPath;
        }
        prevPath = abs;
        prevRelPath = currentPath;
      }
      return abs;
    };

    // buildMap(data);

    return `{{${computeAbsolutePath(path)}}}`;
  };

  render() {
    return (
      <div className="json-tree-container row-flex container-fluid p-0">
        <ErrorBoundary showFallback={true}>
          <JSONNode
            data={this.state.data}
            shouldExpandNode={this.props.shouldExpandNode ?? false}
            getCurrentPath={this.getCurrentNodePath}
            getCurrentNodeType={this.getCurrentNodeType}
            toUseNodeIcons={this.props.useIcons ?? false}
            getLength={this.getLength}
            renderNodeIcons={this.renderNodeIcons}
            useIndentedBlock={this.props.useIndentedBlock ?? false}
            selectedNode={this.state.selectedNode}
            hoveredNode={this.state.hoveredNode}
            selectedWidget={this.state.selectedWidget ?? null}
            updateSelectedNode={this.updateSelectedNode}
            updateHoveredNode={this.updateHoveredNode}
            useActions={this.state.useActions}
            actionsList={this.state.actionsList}
            enableCopyToClipboard={this.state.enableCopyToClipboard}
            getNodeShowHideComponents={this.getNodeShowHideComponents}
            getOnSelectLabelDispatchActions={this.getOnSelectLabelDispatchActions}
            expandWithLabels={this.props.expandWithLabels ?? false} //expand and collapse: onclick of label
            getAbsoluteNodePath={this.getAbsoluteNodePath}
            fontSize={this.props.fontSize ?? '12px'}
            inspectorTree={this.props.treeType === 'inspector'}
            debuggerTree={this.props.treeType === 'debugger'}
            renderCurrentNodeInfoIcon={this.renderCurrentNodeInfoIcon}
          />
        </ErrorBoundary>
      </div>
    );
  }
}
