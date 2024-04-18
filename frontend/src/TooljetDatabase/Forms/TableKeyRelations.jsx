import React, { useContext, useState } from 'react';
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

function SourceKeyRelation({ tableName, columns, isEditMode, isEditColumn }) {
  const [targetColumn, setTargetColumn] = useState([]);
  const { tables, organizationId, selectedTable, setForeignKeys } = useContext(TooljetDatabaseContext);
  const [selectedSourceColumn, setSelectedSourceColumn] = useState({});

  const sourceTable = [
    {
      name: tableName,
      label: tableName,
      icon: <Serial width="16" height="16" />,
      value: tableName,
    },
  ];

  const sourceColumns = isEditColumn
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
      name: 'No action',
      label: 'No action',
      value: 'No action',
    },
    {
      name: 'Cascade',
      label: 'Cascade',
      value: 'Cascade',
    },
    {
      name: 'Restrict',
      label: 'Restrict',
      value: 'Restrict',
    },
    {
      name: 'Set as null',
      label: 'Set as null',
      value: 'Set as null',
    },
    {
      name: 'Set as default',
      label: 'Set as default',
      value: 'Set as default',
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
    targetColumn.length > 0 && !isEditColumn
      ? targetColumn?.filter((item) => selectedSourceColumn.dataType === item.dataType)
      : isEditColumn && targetColumn.length > 0
      ? targetColumn?.filter((item) => sourceColumns[0].dataType === item.dataType)
      : [];

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
          firstColumnPlaceholder={'Select Table'}
          secondColumnPlaceholder={'Select Column'}
          tableList={sourceTable}
          tableColumns={sourceColumns}
          source={true}
          setTargetColumn={setTargetColumn}
          selectedSourceColumn={selectedSourceColumn}
          updateSelectedSourceColumns={setSelectedSourceColumn}
          isEditColumn={isEditColumn}
          defaultValue={isEditColumn ? sourceColumns[0] : []}
          onAdd={true}
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
          firstColumnPlaceholder={'Select Table'}
          secondColumnPlaceholder={'Select Column'}
          tableList={tableList}
          tableColumns={targetTableColumns}
          source={false}
          handleSelectColumn={handleSelectColumn}
          showColumnInfo={true}
          showRedirection={true}
          onAdd={true}
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
          firstColumnPlaceholder={'Select action'}
          secondColumnPlaceholder={'Select columns from this table to reference with..'}
          tableList={onUpdateOptions}
          tableColumns={onUpdateOptions}
          source={false}
          showDescription={true}
        />
      </div>
    </div>
  );
}

export default SourceKeyRelation;
