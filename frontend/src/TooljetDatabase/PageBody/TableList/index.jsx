import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { ListItem } from '../TableListItem';

const List = ({ setSelectedTable }) => {
  const { organizationId, tables, setTables } = useContext(TooljetDatabaseContext);
  const [activeTable, setActiveTable] = useState(0);

  async function fetchTables() {
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);

    if (error) {
      toast.error('Failed to fetch tables');
      return;
    }

    if (Array.isArray(data?.result) && data.result.length > 0) {
      setTables(data.result || []);
      setSelectedTable(data.result[0].table_name);
    }
  }

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="subheader mb-2">All tables ({tables.length})</div>
      <div className="list-group list-group-transparent mb-3">
        {tables.map(({ table_name }, index) => (
          <ListItem
            key={index}
            organizationId={organizationId}
            active={activeTable === index}
            text={table_name}
            onDeleteCallback={fetchTables}
            onClick={() => {
              setSelectedTable(table_name);
              setActiveTable(index);
            }}
          />
        ))}
      </div>
    </>
  );
};

export default List;
