import React from 'react';
import Select from '@/_ui/Select';

const userStatusOptions = [
  { name: 'All', value: '' },
  { name: 'Active', value: 'active' },
  { name: 'Invited', value: 'invited' },
  { name: 'Archived', value: 'archived' },
];

const UsersFilter = ({ filterList, darkMode, clearIconPressed }) => {
  const [options, setOptions] = React.useState({ email: '', firstName: '', lastName: '', status: '' });

  const valuesChanged = (event, key) => {
    let newOptions = {};
    if (!key) {
      newOptions = { ...options, [event.target.name]: event.target.value };
    } else {
      newOptions = { ...options, [key]: event };
    }
    setOptions(newOptions);
  };

  const clearTextAndResult = () => {
    setOptions({ email: '', firstName: '', lastName: '', status: '' });
    clearIconPressed();
  };

  const handleEnterKey = (e) => {
    if (e.key === 'Enter') filterList(options);
  };

  return (
    <div className="container-xl">
      <div className="row mb-3">
        <div className="col-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            name="email"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.email}
            data-cy="email-filter-input-field"
          />
        </div>
        <div className="col-2">
          <input
            type="text"
            className="form-control"
            placeholder="First Name"
            name="firstName"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.firstName}
            data-cy="first-name-filter-input-field"
          />
        </div>
        <div className="col-2">
          <input
            type="text"
            className="form-control"
            placeholder="Last Name"
            name="lastName"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.lastName}
            data-cy="last-name-filter-input-field"
          />
        </div>
        <div className="col-2" data-cy="user-status-select-continer">
          <Select
            options={userStatusOptions}
            value={options.status}
            onChange={(value) => valuesChanged(value, 'status')}
            width={'100%'}
            height="36px"
            useMenuPortal={true}
          />
        </div>
        <div className="col-2 d-flex gap-3">
          <button type="submit" className="btn btn-primary" onClick={() => filterList(options)} data-cy="filter-button">
            Filter
          </button>
          <div className="d-flex align-items-center cursor-pointer" onClick={clearTextAndResult}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-x"
              width="44"
              height="44"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke={!darkMode ? '#2c3e50' : '#fff'}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              data-cy="clear-filter-button"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersFilter;
