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
    console.log('componentWillReceiveProps || JSONNodeTree', nextProps);
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

    if (node instanceof Object) {
      return 'Object';
    }
    console.log('typeofCurrentNode [[JSONNodeTree]] ', typeofCurrentNode);
    return typeofCurrentNode;
  }

  render() {
    return (
      <div className="json-tree-wrapper">
        <div className="json-tree-container">
          <JSONNode
            data={this.props.data}
            shouldExpandNode={false}
            getCurrentPath={this.getCurrentNodePath}
            getCurrentNodeType={this.getCurrentNodeType}
          />
        </div>
      </div>
    );
  }
}
