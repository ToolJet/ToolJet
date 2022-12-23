import React from 'react';
import { Button } from '@/_ui/LeftSidebar';
import Select from '@/_ui/Select';
import Pagination from './Paginations';

const Footer = ({
  darkMode,
  handleSelectChange,
  selectedValue,
  gotoNextPage,
  gotoPreviousPage,
  pageCount,
  pageSize,
  openCreateRowDrawer,
}) => {
  const selectOptions = [
    { label: '50 records', value: '50 per page' },
    { label: '100 records', value: '100 per page' },
    { label: '200 records', value: '200 per page' },
    { label: '500 records', value: '500 per page' },
    { label: '1000 records', value: '1000 per page' },
  ];

  return (
    <div className="toojet-db-table-footer card-footer d-flex align-items-center jet-table-footer justify-content-center">
      <div className="table-footer row gx-0">
        <div className="col-5">
          <Button
            onClick={openCreateRowDrawer}
            darkMode={darkMode}
            size="sm"
            styles={{ width: '118px', fontSize: '12px', fontWeight: 700, borderColor: darkMode && 'transparent' }}
          >
            <Button.Content title={'Add new row'} iconSrc={'assets/images/icons/add-row.svg'} direction="right" />
          </Button>
        </div>
        <div className="col d-flex align-items-center justify-content-end">
          <div className="col">
            <Pagination
              darkMode={darkMode}
              gotoNextPage={gotoNextPage}
              gotoPreviousPage={gotoPreviousPage}
              currentPage={pageCount}
              totalPage={pageSize}
            />
          </div>
          <div className="col mx-2">
            <Select
              className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
              options={selectOptions}
              value={selectedValue}
              search={false}
              onChange={(value) => handleSelectChange(value)}
              placeholder={'Select page'}
              useMenuPortal={false}
              menuPlacement="top"
            />
          </div>
          <div className="col-4 mx-2">
            <span>1-100 of 5522 Records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
