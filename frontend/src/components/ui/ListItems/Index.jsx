import React from 'react';
import PropTypes from 'prop-types';
import ListItems from './ListItems';

const ListItemsComponent = (props) => {
  return <ListItems {...props} />;
};

export default ListItemsComponent;

ListItemsComponent.propTypes = {
  width: PropTypes.string,
  background: PropTypes.bool,
  indexed: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  addon: PropTypes.string,
  error: PropTypes.bool,
  supportingVisuals: PropTypes.bool,
  supportingText: PropTypes.string,
  leadingIcon: PropTypes.string,
  trailingActionEdit: PropTypes.bool,
  trailingActionDelete: PropTypes.bool,
  trailingActionMenu: PropTypes.bool,
  trailingActionDuplicate: PropTypes.bool,
  onSaveEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onMenu: PropTypes.func,
  onDuplicate: PropTypes.func,
  className: PropTypes.string,
};

ListItemsComponent.defaultProps = {
  width: '',
  background: false,
  indexed: false,
  disabled: false,
  label: 'List Item',
  addon: '',
  error: false,
  supportingVisuals: false,
  supportingText: '',
  leadingIcon: '',
  trailingActionEdit: false,
  trailingActionDelete: false,
  trailingActionMenu: false,
  trailingActionDuplicate: false,
  onSaveEdit: () => {},
  onDelete: () => {},
  onMenu: () => {},
  onDuplicate: () => {},
  className: '',
};
