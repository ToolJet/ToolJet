import React from 'react';
import Select from '@/_ui/Select';
import SolidIcon from '../../../src/_ui/Icon/SolidIcons';

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

  // const clearTextAndResult = () => {
  //   setOptions({ email: '', firstName: '', lastName: '', status: '' });
  //   clearIconPressed();
  //   setClearPressed(true);
  // };

  const handleEnterKey = (e) => {
    if (e.key === 'Enter') filterList(options);
  };

  return (
    <div className="workspace-settings-table-wrap workspace-settings-filter-wrap">
      <div className="row workspace-settings-filters">
        {/*  <div className="workspace-settings-filter-items">
          <input
            type="email"
            className="form-control tj-input"
            placeholder="Email"
            name="email"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.email}
            data-cy="email-filter-input-field"
          />
        </div>
        <div className="workspace-settings-filter-items">
          <input
            type="text"
            className="form-control tj-input"
            placeholder="First Name"
            name="firstName"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.firstName}
            data-cy="first-name-filter-input-field"
          />
        </div>
        <div className="workspace-settings-filter-items">
          <input
            type="text"
            className="form-control tj-input"
            placeholder="Last Name"
            name="lastName"
            onKeyPress={handleEnterKey}
            onChange={valuesChanged}
            value={options.lastName}
            data-cy="last-name-filter-input-field"
          />
        </div> */}
        <div
          className="workspace-settings-filter-items d-flex align-items-center "
          data-cy="user-status-select-continer"
        >
          <div className="tj-text-xsm mx-3">Showing</div>
          <Select
            options={userStatusOptions}
            value={options.status}
            onChange={(value) => valuesChanged(value, 'status')}
            width={'161.25px'}
            height="32px"
            useMenuPortal={true}
            className="users-filter-dropdown"
          />
        </div>
        <div className="workspace-settings-filter-items workspace-clear-filter-wrap">
          {/* <button type="submit" className="btn btn-primary" onClick={() => filterList(options)} data-cy="filter-button">
            Filter
          </button> */}
          <div className="d-flex align-items-center cursor-pointer">
            <input type="text" className="tj-checkbox" />{' '}
          </div>
        </div>
      </div>
      <div className="line"></div>
    </div>
  );
};

export default UsersFilter;
