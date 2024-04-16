import React, { useContext, useState } from 'react';
import TableDetailsDropdown from './TableDetailsDropdown';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import Source from '../Icons/Source.svg';
import Target from '../Icons/Target.svg';
import Actions from '../Icons/Actions.svg';
import Serial from '../Icons/Serial.svg';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import { getColumnDataType } from '../constants';

function SourceKeyRelation({ tableName, columns, isEditMode }) {
  const [targetColumn, setTargetColumn] = useState({});
  const { tables, organizationId, selectedTable } = useContext(TooljetDatabaseContext);
  const sourceTable = [
    {
      name: tableName,
      label: tableName,
      icon: <Serial width="16" height="16" />,
      value: tableName,
    },
  ];
  const sourceColumns = Object.values(columns).map((item) => {
    return {
      name: item?.column_name,
      label: item?.column_name,
      icon: item?.dataTypeDetails[0]?.icon ?? item?.dataTypeDetails?.icon,
      value: item?.column_name,
    };
  });

  const tableList = tables.map((item) => {
    return {
      value: item?.table_name,
      label: item?.table_name,
    };
  });

  const handleSelectColumn = () => {
    tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      if (data?.result?.length > 0) {
        setTargetColumn(
          data?.result.map(({ column_name, data_type, ...rest }) => ({
            Header: column_name,
            accessor: column_name,
            dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
            ...rest,
          }))
        );
      }
    });
  };

  return (
    <div className="relations-container">
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
          tableColumns={targetColumn}
          source={false}
          handleSelectColumn={handleSelectColumn}
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
        />
      </div>
    </div>
  );
}

export default SourceKeyRelation;
