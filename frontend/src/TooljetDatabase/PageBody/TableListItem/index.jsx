import React from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { ListItemPopover } from './ActionsPopover';

export const ListItem = ({ organizationId, active, onClick, text = '', onDeleteCallback }) => {
  const handleDelete = async () => {
    const { error } = await tooljetDatabaseService.deleteTable(organizationId, text);

    if (error) {
      toast.error(`Failed to delete table "${text}"`);
      return;
    }

    toast.success(`${text} deleted successfully`);
    onDeleteCallback && onDeleteCallback();
  };

  return (
    <div
      className={cx('list-group-item cursor-pointer list-group-item-action text-capitalize', { active })}
      onClick={onClick}
    >
      {text}
      <div className="float-right cursor-pointer">
        <ListItemPopover handleDelete={handleDelete} />
      </div>
    </div>
  );
};
