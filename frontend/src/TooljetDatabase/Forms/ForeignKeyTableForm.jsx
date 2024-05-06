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
  createForeignKeyInEdit = false, // this is for create foreign keys in edit table
  selectedTable,
  isForeignKeyDraweOpen,
  onDeletePopup,
  setSourceColumn,
  sourceColumn,
  setTargetTable,
  targetTable,
  setTargetColumn,
  targetColumn,
  setOnDelete,
  onDelete,
  setOnUpdate,
  onUpdate,
  editForeignKeyInCreateTable,
  selectedForeignkeyIndex,
  setIsForeignKeyDraweOpen,
}) => {
  const createForeignKey = () => {
    handleCreateForeignKey();
    if (isCreateColumn || isEditColumn) {
      setForeignKeyDetails(() => [
        {
          column_names: [sourceColumn?.value],
          referenced_table_name: targetTable?.value,
          referenced_table_id: targetTable?.id,
          referenced_column_names: [targetColumn?.value],
          on_delete: onDelete?.value,
          on_update: onUpdate?.value,
        },
      ]);
    }
  };

  const onEditInCreateMode = () => {
    setForeignKeyDetails(() => [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_table_id: targetTable?.id,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ]);
    setIsForeignKeyDraweOpen(false);
  };

  const selectedForeignKey = foreignKeyDetails[selectedForeignkeyIndex];

  const isDisableSaveBtn =
    (selectedForeignKey?.length > 0 &&
      (selectedForeignKey?.column_names?.[0] === sourceColumn?.value || targetColumn?.value === '')) ||
    (selectedForeignKey?.on_update === onUpdate?.value &&
      selectedForeignKey?.on_delete === onDelete?.value &&
      selectedForeignKey?.referenced_column_names?.[0] === targetColumn?.value &&
      selectedForeignKey?.referenced_table_name === targetTable?.value);

  return (
    <div className="foreignKeyRelation-form-container">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-table-header">
          {`${isEditMode || isEditColumn ? 'Edit' : 'Create'} foreign key relation`}
        </h3>
      </div>
      <SourceKeyRelation
        tableName={tableName}
        columns={columns}
        isEditMode={isEditMode}
        isEditColumn={isEditColumn}
        isCreateColumn={isCreateColumn}
        setForeignKeyDetails={setForeignKeyDetails}
        foreignKeyDetails={foreignKeyDetails}
        createForeignKeyInEdit={createForeignKeyInEdit}
        isForeignKeyDraweOpen={isForeignKeyDraweOpen}
        setSourceColumn={setSourceColumn}
        sourceColumn={sourceColumn}
        setTargetTable={setTargetTable}
        targetTable={targetTable}
        setTargetColumn={setTargetColumn}
        targetColumn={targetColumn}
        setOnDelete={setOnDelete}
        onDelete={onDelete}
        setOnUpdate={setOnUpdate}
        onUpdate={onUpdate}
      />
      <DrawerFooter
        fetching={false}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={editForeignKeyInCreateTable ? onEditInCreateMode : handleEditForeignKey}
        onCreate={createForeignKey}
        shouldDisableCreateBtn={
          isEmpty(sourceColumn) ||
          isEmpty(targetColumn) ||
          isEmpty(targetTable) ||
          isEmpty(onDelete) ||
          isEmpty(onUpdate) ||
          isDisableSaveBtn
        }
        isForeignKeyDraweOpen={isForeignKeyDraweOpen}
        onDeletePopup={onDeletePopup}
        isEditColumn={isEditColumn}
        createForeignKeyInEdit={createForeignKeyInEdit}
        isCreateColumn={isCreateColumn}
        isForeignKeyForColumnDrawer={isForeignKeyForColumnDrawer}
        editForeignKeyInCreateTable={editForeignKeyInCreateTable}
      />
    </div>
  );
};

export default ForeignKeyTableForm;
