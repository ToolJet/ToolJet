import { createSelectColumn } from './selectColumn';
import { createNameColumn } from './nameColumn';
import { createLastEditedColumn } from './lastEditedColumn';
import { createEditedByColumn } from './editedByColumn';
import { createActionsColumn } from './actionsColumn';
import { createDatasourcesActionsColumn } from './datasourcesActionsColumn';
import { createWorkflowsActionsColumn } from './workflowsActionsColumn';

export const appsColumns = (deps = {}) => {
  return [
    createSelectColumn(deps),
    createNameColumn(deps),
    createLastEditedColumn(deps),
    createEditedByColumn(deps),
    createActionsColumn(deps),
  ];
};

export const datasourcesColumns = (deps = {}) => {
  return [
    createSelectColumn(deps),
    createNameColumn(deps),
    createLastEditedColumn(deps),
    createEditedByColumn(deps),
    createDatasourcesActionsColumn(deps),
  ];
};

export const workflowsColumns = (deps = {}) => {
  return [
    createSelectColumn(deps),
    createNameColumn(deps),
    createLastEditedColumn(deps),
    createEditedByColumn(deps),
    createWorkflowsActionsColumn(deps),
  ];
};

export default appsColumns;
