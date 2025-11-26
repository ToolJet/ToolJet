import { createSelectColumn } from './selectColumn';
import { createNameColumn } from './nameColumn';
import { createLastEditedColumn } from './lastEditedColumn';
import { createEditedByColumn } from './editedByColumn';
import { createActionsColumn } from './actionsColumn';

export const appsColumns = (deps = {}) => {
  return [
    createSelectColumn(deps),
    createNameColumn(deps),
    createLastEditedColumn(deps),
    createEditedByColumn(deps),
    createActionsColumn(deps),
  ];
};

export default appsColumns;
