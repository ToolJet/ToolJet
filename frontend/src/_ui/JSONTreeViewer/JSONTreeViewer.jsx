import React from 'react';
import { JSONNode } from './JSONNode';

/**
 * @Props {
 ** shouldExpandNode: true, //? Bool OR Function()
 ** hideRoot: false,
 ** keyPath: ['root'], //! access directly by keyPath
 ** labelRenderer,
 ** valueRenderer,
 ** renderCustomNode: () -> JSX
 ** collectionLimit: 50 //? To Limit the number of items to be displayed in an collection or an array,
 ** darkTheme: false,
 ** cls: '' //custom classes
 * }
 */

export class JSONTreeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {},
      shouldExpandNode: false,
      currentNode: 'Root',
      darkTheme: false,
      selectedNode: null,
      showHideActions: false,
      enableCopyToClipboard: false,
      actionsList: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data,
      shouldExpandNode: nextProps.shouldExpandNode,
      ...nextProps,
    });
  }

  componentDidMount() {
    this.setState({
      data: this.props.data,
    });
  }

  getCurrentNodePath(path, node) {
    let currentPath = path ?? [];
    if (node) {
      currentPath = [...currentPath, node];
    }
    return currentPath;
  }

  getCurrentNodeType(node) {
    const typeofCurrentNode = Object.prototype.toString.call(node).slice(8, -1);
    //Todo: Handle more types (Custom type or Iterable type)

    // console.log('typeofCurrentNode [[JSONNodeTree]] ', typeofCurrentNode, node);
    // if (node instanceof Object) {
    //   return 'Object';
    // }
    return typeofCurrentNode;
  }

  getLength(type, collection) {
    if (!collection) return 0;
    if (type === 'Object') {
      return Object.keys(collection).length;
    } else if (type === 'Array') {
      return collection.length;
    }

    return Infinity;
  }

  renderNodeIcons = (node) => {
    const icon = this.props.iconsList.filter((icon) => icon?.iconName === node)[0];

    if (icon && icon.iconPath) {
      return (
        <img
          style={{ maxWidth: 'none', padding: '2px' }}
          className={`json-tree-svg-icon ${icon.className}`}
          src={icon.iconPath}
        />
      );
    }
    if (icon && icon.jsx) {
      return icon.jsx();
    }
  };

  updateSelectedNode = (node) => {
    if (node) {
      this.setState({
        selectedNode: node,
      });
    }
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
      console.log('From getNodeSHowHideComponents', currentNode, dispatchActionForCurrentNode['actions']);
      dispatchActionForCurrentNode['actions'].map((action) => showHideComponents.push(action));
    }

    return showHideComponents;
    //Todo: if actions should be available for all children
  };

  getOnSelectLabelDispatchActions = (currentNode, path) => {
    const actions = [];
    const parent = path ? path[path.length - 2] : 'root';
    const dispatchActionForCurrentNode = this.getDispatchActionsForNode(parent);
    if (currentNode === parent) return;

    if (dispatchActionForCurrentNode && dispatchActionForCurrentNode['enableFor1stLevelChildren']) {
      dispatchActionForCurrentNode['actions'].map((action) => actions.push(action));
    }
    //Todo: if actions should be available for all children
    return actions;
  };

  render() {
    return (
      <div className="json-tree-container row-flex container-fluid p-0">
        <JSONNode
          data={this.state.data}
          shouldExpandNode={false}
          getCurrentPath={this.getCurrentNodePath}
          getCurrentNodeType={this.getCurrentNodeType}
          toUseNodeIcons={this.props.useIcons ?? false}
          getLength={this.getLength}
          renderNodeIcons={this.renderNodeIcons}
          useIndentedBlock={this.props.useIndentedBlock ?? false}
          selectedNode={this.state.selectedNode}
          updateSelectedNode={this.updateSelectedNode}
          useActions={this.state.useActions}
          actionsList={this.state.actionsList}
          enableCopyToClipboard={this.state.enableCopyToClipboard}
          getNodeShowHideComponents={this.getNodeShowHideComponents}
          getOnSelectLabelDispatchActions={this.getOnSelectLabelDispatchActions}
          expandWithLabels={this.state.expandWithLabels ?? false}
        />
      </div>
    );
  }
}
