import React, { useState, useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateColumnForm from '../../Forms/ColumnForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';

const CreateColumnDrawer = () => {
  const { organizationId, selectedTable, setColumns, setSelectedTableData } = useContext(TooljetDatabaseContext);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCreateColumnDrawerOpen(!isCreateColumnDrawerOpen)}
        className="btn border-0"
        data-cy="add-new-column-button"
      >
        <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.05654 0.550681C1.30659 0.300633 1.64573 0.160156 1.99935 0.160156H4.66602C5.01964 0.160156 5.35878 0.300633 5.60882 0.550681C5.85887 0.800729 5.99935 1.13987 5.99935 1.49349V10.8268C5.99935 11.1804 5.85887 11.5196 5.60882 11.7696C5.35877 12.0197 5.01964 12.1602 4.66602 12.1602H1.99935C1.64573 12.1602 1.30659 12.0197 1.05654 11.7696C0.806491 11.5196 0.666016 11.1804 0.666016 10.8268V1.49349C0.666016 1.13987 0.806492 0.800729 1.05654 0.550681ZM4.66602 1.49349L1.99935 1.49349L1.99935 10.8268H4.66602V1.49349ZM9.33268 4.16016C9.70087 4.16016 9.99935 4.45863 9.99935 4.82682V5.49349H10.666C11.0342 5.49349 11.3327 5.79197 11.3327 6.16016C11.3327 6.52835 11.0342 6.82682 10.666 6.82682H9.99935V7.49349C9.99935 7.86168 9.70087 8.16016 9.33268 8.16016C8.96449 8.16016 8.66602 7.86168 8.66602 7.49349V6.82682H7.99935C7.63116 6.82682 7.33268 6.52835 7.33268 6.16016C7.33268 5.79197 7.63116 5.49349 7.99935 5.49349H8.66602V4.82682C8.66602 4.45863 8.96449 4.16016 9.33268 4.16016Z"
            fill="#889096"
          />
        </svg>
        &nbsp;&nbsp;Add new column
      </button>
      <Drawer isOpen={isCreateColumnDrawerOpen} onClose={() => setIsCreateColumnDrawerOpen(false)} position="right">
        <CreateColumnForm
          onCreate={() => {
            tooljetDatabaseService.viewTable(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
                return;
              }

              if (data?.result?.length > 0) {
                setColumns(
                  data?.result.map(({ column_name, data_type, keytype, ...rest }) => ({
                    Header: column_name,
                    accessor: column_name,
                    dataType: data_type,
                    isPrimaryKey: keytype?.toLowerCase() === 'primary key',
                    ...rest,
                  }))
                );
              }
            });
            tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable}"`);
                return;
              }

              if (Array.isArray(data) && data?.length > 0) {
                setSelectedTableData(data);
              }
            });
            setIsCreateColumnDrawerOpen(false);
          }}
          onClose={() => setIsCreateColumnDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default CreateColumnDrawer;
