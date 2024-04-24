import React, { useContext, useEffect } from 'react';
import TableDetailsDropdown from './TableDetailsDropdown';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import Source from '../Icons/Source.svg';
import Setting from '../Icons/setting.svg';
import Target from '../Icons/Target.svg';
import Actions from '../Icons/Actions.svg';
import Serial from '../Icons/Serial.svg';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import { dataTypes, getColumnDataType } from '../constants';

function SourceKeyRelation({
  tableName,
  columns,
  isEditMode,
  isEditColumn,
  isCreateColumn,
  setTargetColumn,
  targetColumn,
  setForeignKeyDetails,
  foreignKeyDetails,
  createForeignKeyInEdit,
  isForeignKeyDraweOpen,
}) {
  const { tables, organizationId, selectedTable, setForeignKeys } = useContext(TooljetDatabaseContext);

  const sourceTable = [
    {
      name: tableName,
      label: tableName,
      icon: <Serial width="16" height="16" />,
      value: tableName,
    },
  ];

  const sourceColumns =
    isEditColumn || isCreateColumn
      ? [
          {
            name: columns?.column_name,
            label: columns?.column_name,
            icon: columns?.dataTypeDetails?.icon ?? columns?.dataTypeDetails[0]?.icon,
            value: columns?.column_name,
            dataType: columns?.data_type,
          },
        ]
      : Object.values(columns).map((item) => {
          return {
            name: item?.column_name,
            label: item?.column_name,
            icon: item?.dataTypeDetails?.icon ?? item?.dataTypeDetails[0]?.icon,
            value: item?.column_name,
            dataType: item?.data_type,
          };
        });

  const tableList = tables.map((item) => {
    return {
      value: item?.table_name,
      label: item?.table_name,
    };
  });

  const onUpdateOptions = [
    {
      name: 'NO ACTION',
      label: 'NO ACTION',
      value: 'NO ACTION',
    },
    {
      name: 'CASCADE',
      label: 'CASCADE',
      value: 'CASCADE',
    },
    {
      name: 'RESTRICT',
      label: 'RESTRICT',
      value: 'RESTRICT',
    },
    {
      name: 'SET NULL',
      label: 'SET NULL',
      value: 'SET NULL',
    },
    {
      name: 'SET DEFAULT',
      label: 'SET DEFAULT',
      value: 'SET DEFAULT',
    },
  ];

  const handleSelectColumn = (table_name) => {
    tooljetDatabaseService.viewTable(organizationId, table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      const { foreign_keys = [] } = data?.result || {};
      if (data?.result?.columns?.length > 0) {
        setTargetColumn(
          data?.result?.columns.map((item) => ({
            name: item.column_name,
            label: item.column_name,
            icon: dataTypes.filter((obj) => obj.value === item.data_type)[0].icon,
            value: item.column_name,
            dataType: item?.data_type,
          }))
        );
      }
      if (foreign_keys.length) setForeignKeys([...foreign_keys]);
    });
  };

  const targetTableColumns =
    targetColumn.length > 0 && (!isEditColumn || !isCreateColumn)
      ? targetColumn?.filter((item) => foreignKeyDetails?.column_names?.dataType === item?.dataType)
      : (isEditColumn || isCreateColumn) && targetColumn.length > 0
      ? targetColumn?.filter((item) => sourceColumns[0]?.dataType === item?.dataType)
      : [];

  useEffect(() => {
    if ((isEditMode && !createForeignKeyInEdit && isForeignKeyDraweOpen) || isEditColumn) {
      handleSelectColumn(foreignKeyDetails?.referenced_table_name?.value);
    }
  }, [isForeignKeyDraweOpen, isEditColumn]);

  useEffect(() => {
    if (isEditColumn || isCreateColumn) {
      setForeignKeyDetails((prevDetails) => ({
        ...prevDetails,
        column_names: sourceColumns[0],
      }));
    }
  }, [isEditColumn, isCreateColumn]);

  return (
    <div className="relations-container">
      <div className="d-flex align-items-center mb-1">
        <Setting width={18} height={18} />
        <p className="mb-0 source-title">TYPE</p>
        <div className="single-foreign-key">Single</div>
      </div>
      <div className="source mt-3">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Source width={18} height={18} />
            <p className="mb-0 source-title">SOURCE</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'Table'}
          secondColumnName={'Column'}
          tableList={sourceTable}
          tableColumns={sourceColumns}
          source={true}
          setTargetColumn={setTargetColumn}
          isEditColumn={isEditColumn}
          isCreateColumn={isCreateColumn}
          defaultValue={isEditColumn || isCreateColumn ? sourceColumns[0] : []}
          onAdd={true}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
        />
      </div>
      <div className="target mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Target width={18} height={18} />
            <p className="mb-0 source-title">TARGET</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'Table'}
          secondColumnName={'Column'}
          tableList={tableList}
          tableColumns={targetTableColumns}
          source={false}
          handleSelectColumn={handleSelectColumn}
          showColumnInfo={true}
          showRedirection={true}
          onAdd={true}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
        />
      </div>
      <div className="actions mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Actions width={18} height={18} />
            <p className="mb-0 source-title">ACTIONS</p>
          </div>
          <span className="source-description">This is the data to which the current table will be referenced to </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'On update'}
          secondColumnName={'On remove'}
          tableList={onUpdateOptions}
          tableColumns={onUpdateOptions}
          source={false}
          showDescription={true}
          actions={true}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
        />
      </div>
    </div>
  );
}

export default SourceKeyRelation;
