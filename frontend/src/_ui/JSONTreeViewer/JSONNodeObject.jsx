import React from 'react';
import { JSONNode } from './JSONNode';

const JSONTreeObjectNode = ({ data, path, page, pageTree, ...restProps }) => {
  const nodeKeys = Object.keys(data);
  //clean up the data
  return nodeKeys.map((key, index) => {
    const currentPath = page ? [...path, page.name, key] : [...path, key];
    const _currentNode = page ? `${page.name}` : key;
    const props = { ...restProps, pageTree };
    props.isPageTreeActive = pageTree;
    props.currentNode = _currentNode;

    return <JSONNode key={`obj-${key}/${index}`} data={data[key]} path={currentPath} {...props} />;
  });
};

export default JSONTreeObjectNode;
