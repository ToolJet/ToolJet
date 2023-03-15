import React, { useContext } from 'react';
import SolidIcon from '../../_ui/Icon/SolidIcons';
import { TooljetDatabaseContext } from '../index';

const Search = ({ darkMode }) => {
  const { setSearchParam } = useContext(TooljetDatabaseContext);

  const handleChange = (e) => {
    setSearchParam(e.target.value.trim().toLowerCase());
  };

  return (
    <div className="input-icon">
      <span className="input-icon-addon d-flex">
        <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
      </span>
      <input
        onChange={handleChange}
        type="text"
        className="tj-common-search-input"
        data-cy="search-table-input"
        placeholder="Search table"
      />
    </div>
  );
};

export default Search;
