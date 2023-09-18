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
        className={`ghost-black-operation ${isCreateRowDrawerOpen ? 'open' : ''}`}
      >
        {/* <SolidIcon name="editrectangle" width="14" fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'} /> */}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
          <path
            d="M8.216 1.30645C8.80114 0.721316 9.74983 0.721316 10.335 1.30645L11.3944 2.36593C11.9796 2.95106 11.9796 3.89975 11.3944 4.48489L10.4551 5.42426C10.3813 5.38774 10.3037 5.34826 10.2233 5.30591C9.68182 5.02084 9.03927 4.62074 8.55972 4.1412C8.08017 3.66165 7.68008 3.01909 7.39501 2.47762C7.35265 2.39716 7.31316 2.31956 7.27664 2.24581L8.216 1.30645Z"
            fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'}
          />
          <path
            d="M7.87225 4.82866C8.43972 5.39613 9.1614 5.84275 9.73294 6.14639L6.03887 9.84046C5.80963 10.0697 5.51223 10.2184 5.19129 10.2642L2.96638 10.5821C2.47196 10.6527 2.04817 10.2289 2.1188 9.73451L2.43664 7.5096C2.48249 7.18867 2.6312 6.89126 2.86044 6.66202L6.55451 2.96794C6.85815 3.53949 7.30478 4.26119 7.87225 4.82866Z"
            fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'}
          />
          <path
            d="M0.652737 11.562C0.384265 11.562 0.166626 11.7797 0.166626 12.0482C0.166626 12.3166 0.384265 12.5343 0.652737 12.5343H11.3472C11.6157 12.5343 11.8333 12.3166 11.8333 12.0482C11.8333 11.7797 11.6157 11.562 11.3472 11.562H0.652737Z"
            fill={isCreateRowDrawerOpen ? '#3E63DD' : '#889096'}
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
            tooljetDatabaseService.findOne(organizationId, selectedTable.id).then(({ headers, data = [], error }) => {
              if (error) {
                toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
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
