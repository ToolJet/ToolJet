import React from 'react';
import cx from 'classnames';

const ListItem = ({ active, text = '' }) => {
  return (
    <a className={cx('list-group-item list-group-item-action text-capitalize d-flex align-items-center', { active })}>
      {text}
    </a>
  );
};

const List = () => {
  return (
    <>
      <div className="subheader mb-2">All tables (7)</div>
      <div className="list-group list-group-transparent mb-3">
        <ListItem active text="elementary" />
        <ListItem text="primary" />
        <ListItem text="secondary" />
      </div>
    </>
  );
};

export default List;
