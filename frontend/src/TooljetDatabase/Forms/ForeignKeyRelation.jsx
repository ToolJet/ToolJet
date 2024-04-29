import React, { useState, useEffect } from 'react';
import { tooljetDatabaseService } from '@/_services';
import Information from '../Icons/information.svg';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import ForeignKeyTableForm from './ForeignKeyTableForm';
import EditIcon from '../Icons/EditColumn.svg';
import _, { isEmpty } from 'lodash';
import { ConfirmDialog } from '@/_components';

function ForeignKeyRelation({
  onMouseHoverFunction = () => {},
  setIndexHoveredColumn = () => {},
  tableName,
  columns,
  isEditMode,
  setForeignKeyDetails,
  isRequiredFieldsExistForCreateTableOperation,
  foreignKeyDetails,
  organizationId,
  existingForeignKeyDetails, // context state foreignKeys
  setCreateForeignKeyInEdit,
  createForeignKeyInEdit,
  selectedTable,
  setIsForeignKeyDraweOpen,
  isForeignKeyDraweOpen,
}) {
  const [onDeletePopup, setOnDeletePopup] = useState(false);
  const [onChangeInForeignKey, setOnChangeInForeignKey] = useState(false);
  const [selectedForeignkeyIndex, setSelectedForeignKeyIndex] = useState([]);
  const [sourceColumn, setSourceColumn] = useState([]);
  const [targetTable, setTargetTable] = useState([]);
  const [targetColumn, setTargetColumn] = useState([]);
  const [onDelete, setOnDelete] = useState([]);
  const [onUpdate, setOnUpdate] = useState([]);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const existingReferencedTableName = existingForeignKeyDetails[selectedForeignkeyIndex]?.referenced_table_name;
  const existingReferencedColumnName = existingForeignKeyDetails[selectedForeignkeyIndex]?.referenced_column_names[0];
  const currentReferencedTableName = targetTable?.value;
  const currentReferencedColumnName = targetColumn?.value;

  const handleCreateForeignKey = () => {
    setIsForeignKeyDraweOpen(false);
    toast.success(`Foreign key Added successfully for selected column`);
  };

  const handleCreateForeignKeyinEditMode = async () => {
    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];
    const { error } = await tooljetDatabaseService.createForeignKey(organizationId, tableName, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    toast.success(`Foreign key created successfully`);

    setIsForeignKeyDraweOpen(false);
  };

  const handleEditForeignKey = async () => {
    const id = existingForeignKeyDetails[0]?.constraint_name;

    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];

    const { error } = await tooljetDatabaseService.editForeignKey(organizationId, tableName, id, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    toast.success(`Foreign key edited successfully`);

    if (!error) {
      setForeignKeyDetails((prevValues) => {
        const updatedDetails = [...prevValues]; // Create a copy of the array
        updatedDetails[selectedForeignkeyIndex] = {
          column_names: [sourceColumn?.value],
          referenced_table_name: targetTable?.value,
          referenced_column_names: [targetColumn?.value],
          on_delete: onDelete?.value,
          on_update: onUpdate?.value,
        };
        return updatedDetails;
      });
    }
    setIsForeignKeyDraweOpen(false);
  };

  const handleOpenDeletePopup = () => {
    setOnDeletePopup(true);
  };

  const handleDeleteColumn = async () => {
    const id = existingForeignKeyDetails[0]?.constraint_name;
    const { error } = await tooljetDatabaseService.deleteForeignKey(organizationId, tableName, id);

    if (error) {
      toast.error(error?.message ?? `Failed to delete foreign key`);
      return;
    }

    setForeignKeyDetails((prevValues) => {
      const updatedDetails = [...prevValues]; // Create a copy of the array
      updatedDetails.splice(selectedForeignkeyIndex, 1); // Remove the item at the specified index
      return updatedDetails; // Update the state with the modified array
    });
    setOnDeletePopup(false);
    setIsForeignKeyDraweOpen(false);
    toast.success(`Foreign key deleted successfully`);
  };

  const isEdit = isEditMode && !createForeignKeyInEdit ? true : isEditMode && createForeignKeyInEdit ? false : false;
  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  const changesInForeignKey = () => {
    const newForeignKeyDetails = [];

    if (
      currentReferencedColumnName !== existingReferencedColumnName ||
      currentReferencedTableName !== existingReferencedTableName
    ) {
      const newDetail = {};
      if (currentReferencedColumnName !== existingReferencedColumnName) {
        newDetail.columnName = currentReferencedColumnName;
      }
      if (currentReferencedTableName !== existingReferencedTableName) {
        newDetail.tableName = currentReferencedTableName;
      }
      newForeignKeyDetails.push(newDetail);
    }

    return newForeignKeyDetails;
  };

  const newChangesInForeignKey = changesInForeignKey();

  const openEditForeignKey = (sourceColumnName) => {
    setIsForeignKeyDraweOpen(true);
    const existingForeignKeyColumn = foreignKeyDetails?.filter((obj) => obj.column_names === sourceColumnName);
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names === sourceColumnName);
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    setSourceColumn({
      value: existingForeignKeyColumn[0]?.column_names[0],
      label: existingForeignKeyColumn[0]?.column_names[0],
    });
    setTargetTable({
      value: existingForeignKeyColumn[0]?.referenced_table_name,
      label: existingForeignKeyColumn[0]?.referenced_table_name,
    });
    setTargetColumn({
      value: existingForeignKeyColumn[0]?.referenced_column_names[0],
      label: existingForeignKeyColumn[0]?.referenced_column_names[0],
    });
    setOnDelete({
      value: existingForeignKeyColumn[0]?.on_delete,
      label: existingForeignKeyColumn[0]?.on_delete,
    });
    setOnUpdate({
      value: existingForeignKeyColumn[0]?.on_update,
      label: existingForeignKeyColumn[0]?.on_update,
    });
  };

  function checkMatchingColumnNamesInForeignKey(foreignKeys, columns) {
    const columnNamesSet = new Set(Object.values(columns).map((column) => column.column_name));
    for (const foreignKey of foreignKeys) {
      const foreignKeyColumnName = foreignKey.column_names[0];
      if (columnNamesSet.has(foreignKeyColumnName)) {
        return true;
      }
    }
    return false;
  }

  const isMatchingForeignKeyColumns = checkMatchingColumnNamesInForeignKey(existingForeignKeyDetails, columns);

  return (
    <>
      <div className="foreignkey-relation-container">
        <div className="foreign-key-heading">
          <span>Foreign key relation</span>
        </div>

        {foreignKeyDetails?.length === 0 || !isMatchingForeignKeyColumns ? (
          <div className="empty-foreignkey-container d-flex align-items-center justify-content-center rounded mt-2 p-2">
            <Information width="20" />
            <p style={{ marginLeft: '6px', color: '#687076' }} className="mb-0">
              No relation added yet
            </p>
          </div>
        ) : (
          foreignKeyDetails?.length > 0 &&
          isMatchingForeignKeyColumns &&
          foreignKeyDetails?.map((item, index) => (
            <div className="foreignKey-details" onClick={() => onMouseHoverFunction(item.column_names)} key={index}>
              <span className="foreignKey-text">{item.column_names}</span>

              <div className="foreign-key-relation">
                <ForeignKeyRelationIcon width="13" height="13" />
              </div>
              <span className="foreignKey-text">{`${item.referenced_table_name}.${item.referenced_column_names}`}</span>
              <div className="editForeignkey" onClick={() => openEditForeignKey(item.column_names)}>
                <EditIcon width="17" height="18" />
              </div>
            </div>
          ))
        )}

        <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            style={{ fontSize: '14px' }}
            onClick={() => {
              setIsForeignKeyDraweOpen(true);
              setCreateForeignKeyInEdit(true);
            }}
            disabled={
              isEmpty(tableName) ||
              (!isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation)) ||
              isEmpty(columns) ||
              (isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation))
            }
          >
            <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            &nbsp;&nbsp; Add relation
          </ButtonSolid>
        </div>
      </div>
      <Drawer
        isOpen={isForeignKeyDraweOpen}
        position="right"
        drawerStyle={{ width: '560px' }}
        isForeignKeyRelation={true}
        onClose={() => {
          setIsForeignKeyDraweOpen(false);
          setCreateForeignKeyInEdit(false);
        }}
      >
        <ForeignKeyTableForm
          tableName={tableName}
          columns={columns}
          isEditMode={isEdit}
          // isEditMode={false}
          onClose={() => {
            setIsForeignKeyDraweOpen(false);
            setCreateForeignKeyInEdit(false);
          }}
          handleCreateForeignKey={
            isEditMode && createForeignKeyInEdit ? handleCreateForeignKeyinEditMode : handleCreateForeignKey
          }
          setForeignKeyDetails={setForeignKeyDetails}
          foreignKeyDetails={foreignKeyDetails}
          handleEditForeignKey={() =>
            newChangesInForeignKey.length > 0 ? setOnChangeInForeignKey(true) : handleEditForeignKey()
          }
          createForeignKeyInEdit={createForeignKeyInEdit}
          selectedTable={selectedTable}
          isForeignKeyDraweOpen={isForeignKeyDraweOpen}
          onDeletePopup={handleOpenDeletePopup}
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
      </Drawer>
      <ConfirmDialog
        title={'Delete foreign key'}
        show={onDeletePopup}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={handleDeleteColumn}
        onCancel={() => {
          setOnDeletePopup(false);
        }}
        darkMode={darkMode}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => {
          setOnDeletePopup(false);
        }}
        confirmButtonText={'Continue'}
        cancelButtonText={'Cancel'}
        // confirmIcon={<DeleteIcon />}
        footerStyle={footerStyle}
      />
      <ConfirmDialog
        title={'Change in foreign key relation'}
        show={onChangeInForeignKey}
        message={
          <div>
            <span>
              Updating the foreign key relation will drop the current constraint and add the new one. This will also
              replace the default value set in the target table columns with those of the source table. Read docs to
              know more.
            </span>
            <p className="mt-3 mb-0">Are you sure you want to continue?</p>
          </div>
        }
        onConfirm={() => {
          handleEditForeignKey();
          setOnChangeInForeignKey(false);
        }}
        onCancel={() => setOnChangeInForeignKey(false)}
        darkMode={darkMode}
        confirmButtonType="primary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => setOnChangeInForeignKey(false)}
        confirmButtonText={'Continue'}
        cancelButtonText={'Cancel'}
        footerStyle={footerStyle}
        // currentPrimaryKeyIcons={currentPrimaryKeyIcons}
        // newPrimaryKeyIcons={newPrimaryKeyIcons}
        isEditToolJetDbTable={true}
        foreignKeyChanges={newChangesInForeignKey}
        existingReferencedTableName={existingReferencedTableName}
        existingReferencedColumnName={existingReferencedColumnName}
        currentReferencedTableName={currentReferencedTableName}
        currentReferencedColumnName={currentReferencedColumnName}
      />
    </>
  );
}

export default ForeignKeyRelation;
