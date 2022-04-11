import React from 'react';

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
  //Common Methods for all the NODE TYPES

  render() {
    return <div className="json-tree-wrapper">{/* JSON Nodes */}</div>;
  }
}
