import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import ColumnName from '../Icons/ColumnName.svg';
import TableSchema from './TableSchema';
import ForeignKeyRelation from './ForeignKeyRelation';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import _, { isEmpty } from 'lodash';

const ColumnsForm = ({
  columns,
  setColumns,
  isEditMode,
  editColumns,
  tableName,
  setForeignKeyDetails,
  isRequiredFieldsExistForCreateTableOperation,
  foreignKeyDetails,
  organizationId,
  existingForeignKeyDetails,
  setCreateForeignKeyInEdit,
  createForeignKeyInEdit = false,
  selectedTable,
  setForeignKeys,
  handleInputError,
}) => {
  const [columnSelection, setColumnSelection] = useState({ index: 0, value: '', configurations: {} });
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);

  const handleDelete = (index) => {
    const newColumns = { ...columns };
    delete newColumns[index];
    setColumns(newColumns);
  };

  const onMouseHover = (char = []) => {
    const isNameAvailable = Object.values(columns).some((obj) => {
      return Object.values(obj).some((value) => {
        return char.includes(value);
      });
    });

    const index = Object.values(columns).findIndex((obj) => {
      return Object.values(obj).some((value) => {
        return char.includes(value);
      });
    });

    if (isNameAvailable === true) {
      setHoveredColumn(index);
      setTimeout(() => {
        setHoveredColumn(null);
      }, 3000);
    } else {
      setHoveredColumn(null);
    }
  };
  // const handleDeleteEditColumn = (index) => {
  //   const newColumns = { ...editColumns };
  //   delete newColumns[index];
  //   setColumns(newColumns);
  // };

  // const isNameAvailable = Object.values(columns).some((obj) => Object.values(obj).includes(char));

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="create-column-drawer">
      <div className="card-header">
        <h3 className={cx('card-sub-title', { 'card-sub-title-light': !darkMode })} data-cy="add-columns-header">
          Table schema
        </h3>
      </div>
      <div className="card-body">
        <div
          className={cx('list-group-item', {
            'text-white': darkMode,
          })}
        >
          <div className="row">
            <div className="m-0 d-flex align-items-center  column-name-description">
              <ColumnName />
              <span style={{ marginLeft: '6px' }} data-cy="name-input-field-label">
                Column name
              </span>
            </div>
            <div className="m-0 dataType-description">
              <span data-cy="type-input-field-label">Type</span>
            </div>
            <div className="m-0 defaultValue-description">
              <span data-cy="default-input-field-label">Default value</span>
            </div>
            <div className="m-0 primaryKey-description">
              <span data-cy="default-input-field-label">Primary</span>
            </div>
          </div>
        </div>

        <TableSchema
          columns={columns}
          editColumns={editColumns}
          setColumns={setColumns}
          darkMode={darkMode}
          columnSelection={columnSelection}
          setColumnSelection={setColumnSelection}
          handleDelete={handleDelete}
          isEditMode={isEditMode}
          setForeignKeyDetails={setForeignKeyDetails}
          isActiveForeignKey={
            !isEmpty(foreignKeyDetails?.column_names) &&
            !isEmpty(foreignKeyDetails?.referenced_column_names) &&
            !isEmpty(foreignKeyDetails?.referenced_table_name) &&
            !isEmpty(foreignKeyDetails?.on_delete) &&
            !isEmpty(foreignKeyDetails?.on_update)
          }
          indexHover={hoveredColumn}
          foreignKeyDetails={foreignKeyDetails}
          existingForeignKeyDetails={existingForeignKeyDetails} // foreignKeys from context state
          handleInputError={handleInputError}
        />

        <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            style={{ fontSize: '14px' }}
            onClick={() => {
              setColumns((prevColumns) => ({
                ...prevColumns,
                [+Object.keys(prevColumns).pop() + 1 || 0]: { configurations: {} },
              })),
                setColumnSelection({ index: 0, value: '', configurations: {} });
            }}
            data-cy="add-more-columns-button"
          >
            <AddRectangle width="14" height="14" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            <span className="add-text">Add more columns</span>
          </ButtonSolid>
        </div>

        <ForeignKeyRelation
          onMouseHoverFunction={onMouseHover}
          setHoveredColumn={setHoveredColumn}
          tableName={tableName}
          columns={columns}
          setColumns={setColumns}
          isEditMode={isEditMode}
          setForeignKeyDetails={setForeignKeyDetails}
          isRequiredFieldsExistForCreateTableOperation={isRequiredFieldsExistForCreateTableOperation}
          foreignKeyDetails={foreignKeyDetails}
          organizationId={organizationId}
          existingForeignKeyDetails={existingForeignKeyDetails}
          setForeignKeys={setForeignKeys}
          setCreateForeignKeyInEdit={setCreateForeignKeyInEdit}
          createForeignKeyInEdit={createForeignKeyInEdit}
          selectedTable={selectedTable}
          setIsForeignKeyDraweOpen={setIsForeignKeyDraweOpen}
          isForeignKeyDraweOpen={isForeignKeyDraweOpen}
        />
      </div>
    </div>
  );
};

export default ColumnsForm;
