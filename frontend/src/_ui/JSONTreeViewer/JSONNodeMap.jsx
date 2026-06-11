import React from 'react';
import { JSONNode } from './JSONNode';

const JSONNodeMap = ({ data, path, ...restProps }) => {
  let list = Object.fromEntries(data);

  return <JSONNode data={list} path={path} {...restProps} />;
};

export default JSONNodeMap;
