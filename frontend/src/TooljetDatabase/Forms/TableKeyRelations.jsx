import React, { useContext, useEffect, useState } from 'react';
import TableDetailsDropdown from './TableDetailsDropdown';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import Source from '../Icons/Source.svg';
import Setting from '../Icons/setting.svg';
import Target from '../Icons/Target.svg';
import Actions from '../Icons/Actions.svg';
import Serial from '../Icons/Serial.svg';
import _, { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { getPrivateRoute } from '@/_helpers/routes';
import { dataTypes, getColumnDataType } from '../constants';

function SourceKeyRelation({
  tableName,
  columns,
  isEditMode,
  isEditColumn,
  isCreateColumn,
  setForeignKeyDetails,
  foreignKeyDetails,
  createForeignKeyInEdit,
  isForeignKeyDraweOpen,
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
}) {
  const { tables, organizationId, selectedTable, setTables } = useContext(TooljetDatabaseContext);
  const [targetColumnList, setTargetColumnList] = useState([]);

  async function fetchTables() {
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch tables');
      return;
    }

    if (!isEmpty(data?.result)) {
      setTables(data.result || []);
    } else {
      setTables([]);
    }
  }

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
            isDisabled: columns?.data_type === 'serial' || columns?.data_type === 'boolean' ? true : false,
          },
        ]
      : Object.values(columns).map((item) => {
          return {
            name: item?.column_name,
            label: item?.column_name,
            icon: item?.dataTypeDetails?.icon ?? item?.dataTypeDetails?.[0]?.icon,
            value: item?.column_name,
            dataType: item?.data_type,
            isDisabled:
              item?.data_type === 'serial' ||
              item?.data_type === 'boolean' ||
              item?.data_type === 'timestamp with time zone' ||
              item?.data_type === 'jsonb'
                ? true
                : false,
          };
        });

  const tableList = tables
    .filter((item) => item?.table_name !== tableName)
    .map((item) => ({ value: item?.table_name, label: item?.table_name, id: item.id }));

  const onUpdateOptions = [
    // {
    //   name: 'NO ACTION',
    //   label: 'NO ACTION',
    //   value: 'NO ACTION',
    // },
    {
      name: 'RESTRICT',
      label: 'RESTRICT',
      value: 'RESTRICT',
    },
    {
      name: 'CASCADE',
      label: 'CASCADE',
      value: 'CASCADE',
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
  const onDeleteOptions = [
    // {
    //   name: 'NO ACTION',
    //   label: 'NO ACTION',
    //   value: 'NO ACTION',
    // },
    {
      name: 'RESTRICT',
      label: 'RESTRICT',
      value: 'RESTRICT',
    },
    {
      name: 'CASCADE',
      label: 'CASCADE',
      value: 'CASCADE',
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

  useEffect(() => {
    // When this component is mounted by default we are setting onDelete and onUpdate action with first value of onUpdateOptions, so that by default no action is selected for the actions dropdown
    if (_.isEmpty(onDelete)) {
      setOnDelete(onDeleteOptions[0]);
    }
    if (_.isEmpty(onUpdate)) {
      setOnUpdate(onUpdateOptions[0]);
    }
  }, []);

  const handleSelectColumn = (table_name = '') => {
    if (table_name?.length > 0) {
      tooljetDatabaseService.viewTable(organizationId, table_name).then(({ data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
          return;
        }

        const { foreign_keys = [] } = data?.result || {};
        if (data?.result?.columns?.length > 0) {
          setTargetColumnList(
            data?.result?.columns.map((item) => ({
              name: item.column_name,
              label: item.column_name,
              icon: dataTypes.filter(
                (obj) =>
                  obj.value === getColumnDataType({ column_default: item.column_default, data_type: item.data_type })
              )[0]?.icon,
              value: item.column_name,
              dataType: getColumnDataType({ column_default: item.column_default, data_type: item.data_type }),
            }))
          );
        }
      });
      // setTargetColumn({ value: '', label: '', dataType: '' });
    }
  };

  const targetTableColumns =
    targetColumnList.length > 0 && (!isEditColumn || !isCreateColumn)
      ? targetColumnList?.filter((item) => {
          if (sourceColumn.dataType === 'integer') {
            return item.dataType === 'integer' || item.dataType === 'serial';
          } else if (sourceColumn.dataType === 'bigint') {
            return item.dataType === 'integer' || item.dataType === 'bigint';
          } else {
            return item.dataType === sourceColumn.dataType;
          }
        })
      : (isEditColumn || isCreateColumn) && targetColumnList.length > 0
      ? targetColumnList?.filter((item) => sourceColumns[0]?.dataType === item?.dataType)
      : [];

  useEffect(() => {
    if ((isEditMode && !createForeignKeyInEdit) || !createForeignKeyInEdit) {
      handleSelectColumn(targetTable?.value || '');
    } else {
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForeignKeyInEdit, isEditMode]);

  useEffect(() => {
    if (isEditColumn || isCreateColumn) {
      setSourceColumn(sourceColumns[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditColumn, isCreateColumn]);

  const handleNavigateToToolJetDatabase = () => {
    window.open(getPrivateRoute('database'), '_blank');
  };

  const isSameDataTypeColumns =
    sourceColumn?.dataType === 'integer' &&
    (targetColumn?.dataType === 'integer' || targetColumn?.dataType === 'serial')
      ? true
      : sourceColumn?.dataType === 'bigint' &&
        (targetColumn?.dataType === 'integer' || targetColumn?.dataType === 'bigint')
      ? true
      : sourceColumn?.dataType === targetColumn?.dataType
      ? true
      : false;

  useEffect(() => {
    if (!isSameDataTypeColumns) {
      setTargetColumn({ value: '', label: '', dataType: '' });
    }
  }, [isSameDataTypeColumns]);

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
          <span className="source-description">The current table on which foreign key constraint is being added</span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'Table'}
          secondColumnName={'Column'}
          tableList={sourceTable}
          tableColumns={sourceColumns.filter((column) => !isEmpty(column.value.trim()))}
          source={true}
          isEditColumn={isEditColumn}
          isCreateColumn={isCreateColumn}
          defaultValue={isEditColumn || isCreateColumn ? sourceColumns[0] : []}
          onAdd={true}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
          setSourceColumn={setSourceColumn}
          sourceColumn={sourceColumn}
          fetchTables={fetchTables}
          onTableClick={false}
        />
      </div>
      <div className="target-section mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Target width={18} height={18} />
            <p className="mb-0 source-title">TARGET</p>
          </div>
          <span className="source-description">The table that contains foreign key column’s reference</span>
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
          onAdd={handleNavigateToToolJetDatabase}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
          setTargetTable={setTargetTable}
          targetTable={targetTable}
          targetColumn={targetColumn}
          setTargetColumn={setTargetColumn}
          fetchTables={fetchTables}
          onTableClick={true}
          isSourceColumnAvailable={isEmpty(sourceColumn)}
        />
      </div>
      <div className="actions mt-4">
        <div>
          <div className="d-flex align-items-center mb-1">
            <Actions width={18} height={18} />
            <p className="mb-0 source-title">ACTIONS</p>
          </div>
          <span className="source-description">What happens to Source table when Target table is modified </span>
        </div>
        <TableDetailsDropdown
          firstColumnName={'On update'}
          secondColumnName={'On remove'}
          tableList={onUpdateOptions}
          tableColumns={onDeleteOptions}
          source={false}
          showDescription={true}
          actions={true}
          foreignKeyDetails={foreignKeyDetails}
          setForeignKeyDetails={setForeignKeyDetails}
          setOnDelete={setOnDelete}
          onDelete={onDelete}
          setOnUpdate={setOnUpdate}
          onUpdate={onUpdate}
          tableName={tableName}
          targetTable={targetTable}
          fetchTables={fetchTables}
          onTableClick={false}
        />
      </div>
    </div>
  );
}

export default SourceKeyRelation;
