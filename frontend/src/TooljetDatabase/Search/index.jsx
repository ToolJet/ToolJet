import React, { useContext } from 'react';
import { TooljetDatabaseContext } from '../index';

const Search = () => {
  const { setSearchParam } = useContext(TooljetDatabaseContext);

  const handleChange = (e) => {
    setSearchParam(e.target.value.trim().toLowerCase());
  };

  return (
    <div className="input-icon mt-3 mb-3">
      <span className="input-icon-addon d-flex">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <circle cx="10" cy="10" r="7"></circle>
          <line x1="21" y1="21" x2="15" y2="15"></line>
        </svg>
      </span>
      <input
        style={{ height: 28 }}
        onChange={handleChange}
        type="text"
        className="form-control"
        placeholder="Search table"
      />
    </div>
  );
};

export default Search;
