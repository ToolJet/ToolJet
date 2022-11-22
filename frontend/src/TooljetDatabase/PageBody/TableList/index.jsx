import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { ListItem } from '../TableListItem';

const List = () => {
  const { organizationId, tables, searchParam, setTables, setSelectedTable } = useContext(TooljetDatabaseContext);
  const [activeTable, setActiveTable] = useState(0);

  async function fetchTables() {
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch tables');
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

  let filteredTables = [...tables];

  if (searchParam) {
    filteredTables = tables.filter(({ table_name }) => table_name.toLowerCase().includes(searchParam));
  }

  return (
    <>
      <div className="subheader mb-2">All tables ({filteredTables.length})</div>
      <div className="list-group list-group-transparent mb-3">
        {filteredTables.map(({ table_name }, index) => (
          <ListItem
            key={index}
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
