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
      currentPath.push(node);
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

  renderNodeIcons = (node) => {
    const icon = this.props.iconsList.filter((icon) => icon?.iconName === node)[0];

    if (icon && icon.iconPath) {
      return (
        <img style={{ maxWidth: 'none' }} className={`json-tree-svg-icon ${icon.className}`} src={icon.iconPath} />
      );
    }
    if (icon && icon.jsx) {
      return icon.jsx();
    }
  };

  render() {
    return (
      <div className="json-tree-container">
        <JSONNode
          data={this.state.data}
          shouldExpandNode={false}
          getCurrentPath={this.getCurrentNodePath}
          getCurrentNodeType={this.getCurrentNodeType}
          toUseNodeIcons={this.props.useIcons ?? false}
          renderNodeIcons={this.renderNodeIcons}
          useIndentedBlock={this.props.useIndentedBlock ?? false}
        />
      </div>
    );
  }
}
