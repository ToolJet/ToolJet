import React, { useState } from 'react';
import { Button } from '@/_ui/LeftSidebar';
import Select from '@/_ui/Select';
import Pagination from './Paginations';

const Footer = ({ darkMode, openCreateRowDrawer, totalRecords, fetchTableData }) => {
  const selectOptions = [
    { label: '50 records', value: '50 per page' },
    { label: '100 records', value: '100 per page' },
    { label: '200 records', value: '200 per page' },
    { label: '500 records', value: '500 per page' },
    { label: '1000 records', value: '1000 per page' },
  ];

  const RecordEnum = Object.freeze({
    '50 per page': 50,
    '100 per page': 100,
    '200 per page': 200,
    '500 per page': 500,
    '1000 per page': 1000,
  });

  const [selectedOption, setSelectedOption] = useState('50 per page');
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(RecordEnum[selectedOption]);

  const handleSelectChange = (value) => {
    setSelectedOption(value);
    setPageSize(RecordEnum[value]);

    setPageCount(1);
    fetchTableData(`?limit=${RecordEnum[value]}&offset=0`, RecordEnum[value], 1);
  };

  const handlePageCountChange = (value) => {
    setPageCount(value);

    const limit = RecordEnum[selectedOption];
    const offset = value === 1 ? 0 : (value - 1) * RecordEnum[selectedOption];

    fetchTableData(`?limit=${limit}&offset=${offset}`, limit, value);
  };

  const gotoNextPage = (fromInput = false, value = null) => {
    if (fromInput && value) {
      return handlePageCountChange(value);
    }

    setPageCount((prev) => {
      return prev + 1;
    });

    const limit = RecordEnum[selectedOption];
    const offset = pageCount * RecordEnum[selectedOption];

    fetchTableData(`?limit=${limit}&offset=${offset}`, limit, pageCount + 1);
  };

  const gotoPreviousPage = () => {
    setPageCount((prev) => {
      if (prev - 1 < 1) {
        return prev;
      }
      return prev - 1;
    });

    const limit = RecordEnum[selectedOption];
    const offset = (pageCount - 2) * RecordEnum[selectedOption];

    fetchTableData(`?limit=${limit}&offset=${offset}`, limit, pageCount - 1);
  };

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
              value={selectedOption}
              search={false}
              onChange={(value) => handleSelectChange(value)}
              placeholder={'Select page'}
              useMenuPortal={false}
              menuPlacement="top"
            />
          </div>
          <div className="col-4 mx-2">
            <span>
              {pageCount}-{pageSize} of {totalRecords} Records
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
