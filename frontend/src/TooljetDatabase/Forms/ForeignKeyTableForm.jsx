import React, { useState, useContext } from 'react';
import SourceKeyRelation from './TableKeyRelations';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
const ForeignKeyTableForm = ({
  tableName,
  columns,
  isEditMode = false,
  onClose,
  isEditColumn = false,
  isCreateColumn = false,
  isForeignKeyForColumnDrawer = false,
  handleCreateForeignKey,
  setForeignKeyDetails,
  foreignKeyDetails,
  handleEditForeignKey,
  createForeignKeyInEdit = false,
  selectedTable,
  isForeignKeyDraweOpen,
  onDeletePopup,
}) => {
  const [targetColumn, setTargetColumn] = useState([]);
  const createForeignKey = () => {
    handleCreateForeignKey();
  };

  return (
    <div className="foreignKeyRelation-form-container">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-table-header">
          Create foreign key relation
        </h3>
      </div>
      <SourceKeyRelation
        tableName={tableName}
        columns={columns}
        isEditMode={isEditMode}
        isEditColumn={isEditColumn}
        isCreateColumn={isCreateColumn}
        setTargetColumn={setTargetColumn}
        targetColumn={targetColumn}
        setForeignKeyDetails={setForeignKeyDetails}
        foreignKeyDetails={foreignKeyDetails}
        createForeignKeyInEdit={createForeignKeyInEdit}
        isForeignKeyDraweOpen={isForeignKeyDraweOpen}
      />
      <DrawerFooter
        fetching={false}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={handleEditForeignKey}
        onCreate={createForeignKey}
        shouldDisableCreateBtn={
          isEmpty(foreignKeyDetails?.column_names) ||
          isEmpty(foreignKeyDetails?.referenced_column_names) ||
          isEmpty(foreignKeyDetails?.referenced_table_name) ||
          isEmpty(foreignKeyDetails?.on_delete) ||
          isEmpty(foreignKeyDetails?.on_update)
        }
        isForeignKeyDraweOpen={isForeignKeyDraweOpen}
        onDeletePopup={onDeletePopup}
        isEditColumn={isEditColumn}
        createForeignKeyInEdit={createForeignKeyInEdit}
        isCreateColumn={isCreateColumn}
        isForeignKeyForColumnDrawer={isForeignKeyForColumnDrawer}
      />
    </div>
  );
};

export default ForeignKeyTableForm;
