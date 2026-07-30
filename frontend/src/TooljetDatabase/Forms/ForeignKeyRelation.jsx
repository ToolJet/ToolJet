import React, { useState, useEffect, useContext } from 'react';
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
import { Tooltip } from 'react-tooltip';
import { getColumnDataType, dataTypes } from '../constants';
import { TooljetDatabaseContext } from '../index';
import cx from 'classnames';

function ForeignKeyRelation({
  onMouseHoverFunction = () => {},
  setIndexHoveredColumn = () => {},
  tableName,
  columns,
  setColumns,
  isEditMode,
  setForeignKeyDetails,
  isRequiredFieldsExistForCreateTableOperation,
  foreignKeyDetails,
  organizationId,
  existingForeignKeyDetails, // context state foreignKeys
  setForeignKeys,
  setCreateForeignKeyInEdit,
  createForeignKeyInEdit,
  selectedTable,
  setIsForeignKeyDraweOpen,
  isForeignKeyDraweOpen,
}) {
  const [onDeletePopup, setOnDeletePopup] = useState(false);
  const [onChangeInForeignKey, setOnChangeInForeignKey] = useState(false);
  const [editForeignKeyInCreateTable, setEditForeignKeyInCreateTable] = useState(false);
  const [selectedForeignkeyIndex, setSelectedForeignKeyIndex] = useState([]);
  const [sourceColumn, setSourceColumn] = useState([]);
  const [targetTable, setTargetTable] = useState([]);
  const [targetColumn, setTargetColumn] = useState([]);
  const [onDelete, setOnDelete] = useState([]);
  const [onUpdate, setOnUpdate] = useState([]);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const existingReferencedTableName = foreignKeyDetails[selectedForeignkeyIndex]?.referenced_table_name;
  const existingReferencedColumnName = foreignKeyDetails[selectedForeignkeyIndex]?.referenced_column_names[0];
  const currentReferencedTableName = targetTable?.value;
  const currentReferencedColumnName = targetColumn?.value;
  const disabledFillColor = darkMode ? '#545B64' : '#E4E7EB';
  const enabledFillColor = '#3E63DD';

  const onCloseForeignKeyDrawer = () => {
    setIsForeignKeyDraweOpen(false);
    setCreateForeignKeyInEdit(false);
    setEditForeignKeyInCreateTable(false);
    setSourceColumn([]);
    setTargetTable([]);
    setTargetColumn([]);
    setOnDelete([]);
    setOnUpdate([]);
  };

  const handleCreateForeignKey = () => {
    setForeignKeyDetails((prevValues) => [
      ...prevValues, // Spread previous values
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_table_id: targetTable?.id,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ]);

    onCloseForeignKeyDrawer();
    // toast.success(`Foreign key Added successfully for selected column`);
  };

  const fetchMetaDataApi = async () => {
    tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      const { foreign_keys = [] } = data?.result || {};
      if (data?.result?.columns?.length > 0) {
        setColumns(
          data?.result?.columns.reduce((acc, { column_name, data_type, constraints_type, ...rest }, index) => {
            acc[index] = {
              column_name: column_name,
              data_type: getColumnDataType({ column_default: rest.column_default, data_type }),
              constraints_type: constraints_type,
              dataTypeDetails: dataTypes.filter((item) => item.value === data_type),
              column_default: rest.column_default,
              ...rest,
            };
            return acc;
          }, {})
        );
      }
      if (foreign_keys.length > 0) {
        setForeignKeys([...foreign_keys]);
      } else {
        setForeignKeys([]);
      }
    });
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

    if (!error) {
      setForeignKeyDetails((prevValues) => [
        ...prevValues, // Spread previous values
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

    fetchMetaDataApi();
    toast.success(`Foreign key created successfully`);
    onCloseForeignKeyDrawer();
  };

  const handleEditForeignKey = async () => {
    const id = existingForeignKeyDetails[selectedForeignkeyIndex]?.constraint_name;

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
    fetchMetaDataApi();
    toast.success(`Foreign key edited successfully`);
    onCloseForeignKeyDrawer();
  };

  const handleEditForeignKeyInCreate = (index) => {
    setForeignKeyDetails((prevValues) => {
      const updatedDetails = [...prevValues]; // Make a copy of the existing array
      updatedDetails[index] = {
        // Update the object at the specified index
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_table_id: targetTable?.id,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      };
      return updatedDetails; // Set the state with the updated array
    });
    onCloseForeignKeyDrawer();
  };

  const handleOpenDeletePopup = () => {
    setOnDeletePopup(true);
  };

  const handleDeleteForeignKeyColumn = async () => {
    const id = existingForeignKeyDetails[selectedForeignkeyIndex]?.constraint_name;
    const { error } = await tooljetDatabaseService.deleteForeignKey(organizationId, tableName, id);

    if (error) {
      toast.error(error?.message ?? `Failed to delete foreign key`);
      return;
    }

    fetchMetaDataApi();
    setOnDeletePopup(false);
    onCloseForeignKeyDrawer();
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
    if (!isEdit) {
      setEditForeignKeyInCreateTable(true);
    }
    setIsForeignKeyDraweOpen(true);
    const existingForeignKeyColumn = foreignKeyDetails?.filter((obj) => obj.column_names === sourceColumnName);
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names === sourceColumnName);
    const isMatchedDataType = Object.values(columns).filter(
      (obj) => obj.column_name === existingForeignKeyColumn[0]?.column_names[0]
    );
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    setSourceColumn({
      value: existingForeignKeyColumn[0]?.column_names[0],
      label: existingForeignKeyColumn[0]?.column_names[0],
      dataType: isMatchedDataType[0]?.data_type,
    });
    setTargetTable({
      value: existingForeignKeyColumn[0]?.referenced_table_name,
      label: existingForeignKeyColumn[0]?.referenced_table_name,
    });
    setTargetColumn({
      value: existingForeignKeyColumn[0]?.referenced_column_names[0],
      label: existingForeignKeyColumn[0]?.referenced_column_names[0],
      dataType: isMatchedDataType[0]?.data_type,
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

  // function checkMatchingColumnNamesInForeignKey(foreignKeys, columns) {
  //   const columnNamesSet = new Set(Object.values(columns).map((column) => column.column_name));
  //   for (const foreignKey of foreignKeys) {
  //     const foreignKeyColumnName = foreignKey.column_names[0];
  //     if (columnNamesSet.has(foreignKeyColumnName)) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // const isMatchingForeignKeyColumns = checkMatchingColumnNamesInForeignKey(foreignKeyDetails, columns);

  const { tables } = useContext(TooljetDatabaseContext);

  const checkTablelength = (tableLength, editMode) => {
    if (editMode) {
      //In edit mode if tables are less than 2 then this will return true , which will disable add-relation button below
      return tableLength < 2;
    } else {
      //In create mode if tables are less than 2 then this will return true , which will disable add-relation button below
      return tableLength < 1;
    }
  };
  const disableAddRelationButton =
    checkTablelength(tables?.length, isEditMode) ||
    isEmpty(tableName) ||
    isEmpty(columns) ||
    (!isEditMode && !Object.values(columns).some(isRequiredFieldsExistForCreateTableOperation)) ||
    (isEditMode && !Object.values(columns).some(isRequiredFieldsExistForCreateTableOperation));

  const getTooltipContentFordisableAddRelationButton = (tableLength, tableName, columns) => {
    if (tableLength < 2) {
      return 'At least 2 tables are required to add foreign key relation (source table and target table)';
    } else if (isEmpty(tableName)) {
      return 'Table name is required to add foreign key relation';
    } else if (isEmpty(columns)) {
      return 'At least 1 column is required to add foreign key relation';
    } else if (
      (!isEditMode && !Object.values(columns).some(isRequiredFieldsExistForCreateTableOperation)) ||
      (isEditMode && !Object.values(columns).some(isRequiredFieldsExistForCreateTableOperation))
    ) {
      return 'Please fill all the required fields for at least 1 available column to add foreign key relation';
    } else {
      return '';
    }
  };

  const handleDeleteForeignKeyRelationInCreate = (index) => {
    const newForeignKeyDetails = [...foreignKeyDetails]; // Make a copy of the existing array
    newForeignKeyDetails.splice(index, 1); // Remove the item at the specified index
    setForeignKeyDetails(newForeignKeyDetails);
    onCloseForeignKeyDrawer();
  };

  return (
    <>
      <div className="foreignkey-relation-container">
        <div className="foreign-key-heading">
          <span className={cx('foreign-key-sub-title', { 'foreign-key-sub-title-light': !darkMode })}>
            Foreign key relation
          </span>
          <p className="tj-text-xsm">
            A foreign key relation helps to link rows from existing tables with rows in this table based on a common
            column.
          </p>
        </div>

        {foreignKeyDetails?.length > 0 ? (
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
        ) : (
          <div className="empty-foreignkey-container d-flex align-items-center justify-content-center rounded mt-2 p-2">
            <Information width="20" />
            <p style={{ marginLeft: '6px', color: '#687076' }} className="mb-0">
              No relation added yet
            </p>
          </div>
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
            disabled={disableAddRelationButton}
            data-tooltip-id="add-relation-tooltip"
            data-tooltip-content={getTooltipContentFordisableAddRelationButton(tables?.length, tableName, columns)}
          >
            <AddRectangle
              width="15"
              fill={disableAddRelationButton ? disabledFillColor : enabledFillColor}
              opacity="1"
              secondaryFill="#FFFFFF"
            />
            <span className="add-text">Add relation</span>
            {disableAddRelationButton && <Tooltip id="add-relation-tooltip" place="bottom" className="tooltip" />}
          </ButtonSolid>
        </div>
        {/* {!isEditMode && foreignKeyDetails.length >= 1 && (
          <span className="tj-text-xsm"> Create table to add foreign key relation</span>
        )} */}
        {/* <div></div> */}
      </div>
      <Drawer
        isOpen={isForeignKeyDraweOpen}
        position="right"
        drawerStyle={{ width: '560px' }}
        isForeignKeyRelation={true}
        onClose={() => {
          onCloseForeignKeyDrawer();
        }}
        className="tj-db-drawer"
      >
        <ForeignKeyTableForm
          tableName={tableName}
          columns={columns}
          isEditMode={isEdit}
          onClose={() => {
            onCloseForeignKeyDrawer();
          }}
          handleCreateForeignKey={
            isEditMode && createForeignKeyInEdit ? handleCreateForeignKeyinEditMode : handleCreateForeignKey
          }
          setForeignKeyDetails={setForeignKeyDetails}
          foreignKeyDetails={foreignKeyDetails}
          handleEditForeignKey={() =>
            editForeignKeyInCreateTable
              ? newChangesInForeignKey?.length > 0
                ? setOnChangeInForeignKey(true)
                : handleEditForeignKeyInCreate()
              : newChangesInForeignKey?.length > 0
              ? setOnChangeInForeignKey(true)
              : handleEditForeignKey()
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
          editForeignKeyInCreateTable={editForeignKeyInCreateTable}
          selectedForeignkeyIndex={selectedForeignkeyIndex}
          setIsForeignKeyDraweOpen={setIsForeignKeyDraweOpen}
          initiator="ForeignKeyTableForm"
        />
      </Drawer>
      <ConfirmDialog
        title={'Delete foreign key'}
        show={onDeletePopup}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={() => {
          if (editForeignKeyInCreateTable) {
            handleDeleteForeignKeyRelationInCreate(selectedForeignkeyIndex);
            setOnDeletePopup(false);
          } else {
            handleDeleteForeignKeyColumn();
          }
        }}
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
          if (editForeignKeyInCreateTable) {
            handleEditForeignKeyInCreate(selectedForeignkeyIndex);
            setOnChangeInForeignKey(false);
          } else {
            handleEditForeignKey();
            setOnChangeInForeignKey(false);
          }
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
