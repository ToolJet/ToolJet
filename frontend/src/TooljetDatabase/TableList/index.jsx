import React, { useState, useEffect, useContext } from 'react';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'react-hot-toast';
import { isEmpty } from 'lodash';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import { ListItem } from '../TableListItem';
import { BreadCrumbContext } from '../../App/App';
import Search from '../Search';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const List = () => {
  const { organizationId, tables, searchParam, selectedTable, setTables, setSelectedTable } =
    useContext(TooljetDatabaseContext);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  async function fetchTables() {
    setLoading(true);
    const { error, data } = await tooljetDatabaseService.findAll(organizationId);
    setLoading(false);

    if (error) {
      toast.error(error?.message ?? 'Failed to fetch tables');
      return;
    }

    if (Array.isArray(data?.result)) {
      setTables(data.result || []);
      setSelectedTable(data?.result[0]?.table_name);
      updateSidebarNAV(data?.result[0]?.table_name);
    }
  }

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let filteredTables = [...tables];

  if (!isEmpty(searchParam)) {
    filteredTables = tables.filter(({ table_name }) => table_name.toLowerCase().includes(searchParam));
  }

  return (
    <>
      <div
        className="subheader d-flex justify-content-between align-items-center  tj-text-xsm font-weight-500"
        data-cy="all-tables-subheader"
        style={{ marginBottom: '8px' }}
      >
        {!showInput ? (
          <>
            <span>All tables ({filteredTables.length})</span>

            <div
              className="folder-create-btn search-icon-wrap"
              onClick={() => {
                setShowInput(true);
              }}
              data-cy="create-new-folder-button"
            >
              <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
            </div>
          </>
        ) : (
          <Search
            darkMode={darkMode}
            onClearCallback={() => setShowInput(false)}
            customClass="tj-common-search-input"
            autoFocus={true}
          />
        )}
      </div>
      <div className="list-group mb-3">
        {loading && <Skeleton count={3} height={22} />}
        {!loading &&
          filteredTables?.map(({ table_name }, index) => (
            <ListItem
              key={index}
              active={table_name === selectedTable}
              text={table_name}
              onDeleteCallback={fetchTables}
              onClick={() => {
                setSelectedTable(table_name);
                updateSidebarNAV(table_name);
              }}
            />
          ))}
      </div>
    </>
  );
};

export default List;
