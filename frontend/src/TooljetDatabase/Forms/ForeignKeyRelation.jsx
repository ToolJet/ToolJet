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
  existingForeignKeyDetails,
  setCreateForeignKeyInEdit,
  createForeignKeyInEdit,
  selectedTable,
  setIsForeignKeyDraweOpen,
  isForeignKeyDraweOpen,
}) {
  const [onDelete, setOnDelete] = useState(false);
  const [onChangeInForeignKey, setOnChangeInForeignKey] = useState(false);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const existingReferencedTableName = existingForeignKeyDetails[0]?.referenced_table_name;
  const existingReferencedColumnName = existingForeignKeyDetails[0]?.referenced_column_names[0];
  const currentReferencedTableName = foreignKeyDetails?.referenced_table_name?.value;
  const currentReferencedColumnName = foreignKeyDetails?.referenced_column_names?.value;

  const handleCreateForeignKey = () => {
    setIsForeignKeyDraweOpen(false);
    toast.success(`Foreign key created successfully`);
  };

  const handleCreateForeignKeyinEditMode = async () => {
    const data = [
      {
        column_names: [foreignKeyDetails?.column_names?.value],
        referenced_table_name: foreignKeyDetails?.referenced_table_name?.value,
        referenced_column_names: [foreignKeyDetails?.referenced_column_names?.value],
        on_delete: foreignKeyDetails?.on_delete?.value,
        on_update: foreignKeyDetails?.on_update?.value,
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
        column_names: [foreignKeyDetails?.column_names?.value],
        referenced_table_name: foreignKeyDetails?.referenced_table_name?.value,
        referenced_column_names: [foreignKeyDetails?.referenced_column_names?.value],
        on_delete: foreignKeyDetails?.on_delete?.value,
        on_update: foreignKeyDetails?.on_update?.value,
      },
    ];
    const { error } = await tooljetDatabaseService.editForeignKey(organizationId, tableName, id, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    toast.success(`Foreign key edited successfully`);

    setIsForeignKeyDraweOpen(false);
  };

  const handleOpenDeletePopup = () => {
    setOnDelete(true);
  };

  const handleDeleteColumn = async () => {
    const id = existingForeignKeyDetails[0]?.constraint_name;
    const { error } = await tooljetDatabaseService.deleteForeignKey(organizationId, tableName, id);

    if (error) {
      toast.error(error?.message ?? `Failed to delete foreign key`);
      return;
    }

    setForeignKeyDetails({});
    setOnDelete(false);
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

  return (
    <>
      <div className="foreignkey-relation-container">
        <div className="foreign-key-heading">
          <span>Foreign key relation</span>
        </div>

        {isEmpty(foreignKeyDetails?.column_names) ||
        isEmpty(foreignKeyDetails?.referenced_column_names) ||
        isEmpty(foreignKeyDetails?.referenced_table_name) ||
        isEmpty(foreignKeyDetails?.on_delete) ||
        isEmpty(foreignKeyDetails?.on_update) ? (
          <div className="empty-foreignkey-container d-flex align-items-center justify-content-center rounded mt-2 p-2">
            <Information width="20" />
            <p style={{ marginLeft: '6px', color: '#687076' }} className="mb-0">
              No relation added yet
            </p>
          </div>
        ) : (
          <div
            className="foreignKey-details"
            onClick={() => onMouseHoverFunction(foreignKeyDetails.column_names.value)}
          >
            <span className="foreignKey-text">{foreignKeyDetails.column_names.value}</span>
            <div className="foreign-key-relation">
              <ForeignKeyRelationIcon width="13" height="13" />
            </div>
            <span className="foreignKey-text">{`${foreignKeyDetails.referenced_table_name.value}.${foreignKeyDetails.referenced_column_names.value}`}</span>
            <div className="editForeignkey" onClick={() => setIsForeignKeyDraweOpen(true)}>
              <EditIcon width="17" height="18" />
            </div>
          </div>
        )}

        {(isEmpty(foreignKeyDetails?.column_names) ||
          isEmpty(foreignKeyDetails?.referenced_column_names) ||
          isEmpty(foreignKeyDetails?.referenced_table_name) ||
          isEmpty(foreignKeyDetails?.on_delete) ||
          isEmpty(foreignKeyDetails?.on_update)) && (
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
        )}
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
        />
      </Drawer>
      <ConfirmDialog
        title={'Delete foreign key'}
        show={onDelete}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={handleDeleteColumn}
        onCancel={() => {
          setOnDelete(false);
        }}
        darkMode={darkMode}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => {
          setOnDelete(false);
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
