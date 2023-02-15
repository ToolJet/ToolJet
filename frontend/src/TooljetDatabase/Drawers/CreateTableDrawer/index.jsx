import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import CreateTableForm from '../../Forms/TableForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';

export default function CreateTableDrawer() {
  const { organizationId, setSelectedTable, setTables } = useContext(TooljetDatabaseContext);
  const [isCreateTableDrawerOpen, setIsCreateTableDrawerOpen] = useState(false);

  return (
    <>
      <button
        className="add-table-btn btn btn-primary active w-100"
        type="button"
        onClick={() => setIsCreateTableDrawerOpen(!isCreateTableDrawerOpen)}
      >
        <svg className="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.66699 2.66659C4.49018 2.66659 4.32061 2.73682 4.19559 2.86185C4.07056 2.98687 4.00033 3.15644 4.00033 3.33325V12.6666C4.00033 12.8434 4.07056 13.013 4.19559 13.138C4.32061 13.263 4.49018 13.3333 4.66699 13.3333H11.3337C11.5105 13.3333 11.68 13.263 11.8051 13.138C11.9301 13.013 12.0003 12.8434 12.0003 12.6666V5.99992H10.0003C9.6467 5.99992 9.30756 5.85944 9.05752 5.60939C8.80747 5.35935 8.66699 5.02021 8.66699 4.66659V2.66659H4.66699ZM10.0003 3.60939L11.0575 4.66659H10.0003V3.60939ZM3.25278 1.91904C3.62785 1.54397 4.13656 1.33325 4.66699 1.33325H9.33366C9.51047 1.33325 9.68004 1.40349 9.80506 1.52851L13.1384 4.86185C13.2634 4.98687 13.3337 5.15644 13.3337 5.33325V12.6666C13.3337 13.197 13.1229 13.7057 12.7479 14.0808C12.3728 14.4559 11.8641 14.6666 11.3337 14.6666H4.66699C4.13656 14.6666 3.62785 14.4559 3.25278 14.0808C2.87771 13.7057 2.66699 13.197 2.66699 12.6666V3.33325C2.66699 2.80282 2.87771 2.29411 3.25278 1.91904ZM8.00033 6.66659C8.36852 6.66659 8.66699 6.96506 8.66699 7.33325V8.66659H10.0003C10.3685 8.66659 10.667 8.96506 10.667 9.33325C10.667 9.70144 10.3685 9.99992 10.0003 9.99992H8.66699V11.3333C8.66699 11.7014 8.36852 11.9999 8.00033 11.9999C7.63214 11.9999 7.33366 11.7014 7.33366 11.3333V9.99992H6.00033C5.63214 9.99992 5.33366 9.70144 5.33366 9.33325C5.33366 8.96506 5.63214 8.66659 6.00033 8.66659H7.33366V7.33325C7.33366 6.96506 7.63214 6.66659 8.00033 6.66659Z"
            fill="#FDFDFE"
          />
        </svg>
        Add table
      </button>
      <Drawer isOpen={isCreateTableDrawerOpen} onClose={() => setIsCreateTableDrawerOpen(false)} position="right">
        <CreateTableForm
          onCreate={(tableName) => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? 'Failed to fetch tables');
                return;
              }

              if (Array.isArray(data?.result) && data.result.length > 0) {
                setTables(data.result || []);
                setSelectedTable(tableName);
              }
            });
            setIsCreateTableDrawerOpen(false);
          }}
          onClose={() => setIsCreateTableDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}
