import React, { useContext } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import EditRowForm from '../../Forms/EditRowForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';

const EditRowDrawer = ({ isCreateRowDrawerOpen, setIsCreateRowDrawerOpen }) => {
  const { organizationId, selectedTable, setSelectedTableData, setTotalRecords } = useContext(TooljetDatabaseContext);

  return (
    <>
      <button
        onClick={() => setIsCreateRowDrawerOpen(!isCreateRowDrawerOpen)}
        className={`edit-row-btn border-0 ghost-black-operation ${isCreateRowDrawerOpen && 'open'}`}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.390524 1.21767C0.640573 0.967625 0.979711 0.827148 1.33333 0.827148H10.6667C11.0203 0.827148 11.3594 0.967624 11.6095 1.21767C11.8595 1.46772 12 1.80686 12 2.16048V4.82715C12 5.18077 11.8595 5.51991 11.6095 5.76996C11.3594 6.02001 11.0203 6.16048 10.6667 6.16048H1.33333C0.979711 6.16048 0.640573 6.02001 0.390524 5.76996C0.140476 5.51991 0 5.18077 0 4.82715V2.16048C0 1.80686 0.140476 1.46772 0.390524 1.21767ZM10.6667 2.16048H1.33333L1.33333 4.82715H10.6667V2.16048ZM6 7.49381C6.36819 7.49381 6.66667 7.79229 6.66667 8.16048V8.82715H7.33333C7.70152 8.82715 8 9.12562 8 9.49381C8 9.862 7.70152 10.1605 7.33333 10.1605H6.66667V10.8271C6.66667 11.1953 6.36819 11.4938 6 11.4938C5.63181 11.4938 5.33333 11.1953 5.33333 10.8271V10.1605H4.66667C4.29848 10.1605 4 9.862 4 9.49381C4 9.12562 4.29848 8.82715 4.66667 8.82715H5.33333V8.16048C5.33333 7.79229 5.63181 7.49381 6 7.49381Z"
            fill="#3E63DD"
          />
        </svg>
        &nbsp;&nbsp;
        <span data-cy="edit-row-button-text" className="tj-text-xsm font-weight-500">
          Edit row
        </span>
      </button>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={() => setIsCreateRowDrawerOpen(false)} position="right">
        <EditRowForm
          onEdit={() => {
            tooljetDatabaseService.findOne(organizationId, selectedTable).then(({ headers, data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable}"`);
                return;
              }

              if (Array.isArray(data) && data?.length > 0) {
                const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
                setTotalRecords(totalContentRangeRecords);
                setSelectedTableData(data);
              }
            });
            setIsCreateRowDrawerOpen(false);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default EditRowDrawer;
