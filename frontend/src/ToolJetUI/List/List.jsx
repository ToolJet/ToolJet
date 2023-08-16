import React from 'react';
import './list.scss';
import ListGroup from 'react-bootstrap/ListGroup';

function List({ children, ...restProps }) {
  return <ListGroup {...restProps}>{children}</ListGroup>;
}

function ListItem({ children, ...restProps }) {
  return (
    <ListGroup.Item action {...restProps}>
      {children}
    </ListGroup.Item>
  );
}

List.Item = ListItem;

export default List;
