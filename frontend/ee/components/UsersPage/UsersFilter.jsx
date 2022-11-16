import React from 'react';

const UsersFilter = ({ filterList, darkMode, clearIconPressed }) => {
  const [options, setOptions] = React.useState({ email: '', firstName: '', lastName: '' });

  const valuesChanged = (event) => {
    const newOptions = { ...options, [event.target.name]: event.target.value };
    setOptions(newOptions);
  };

  const clearTextAndResult = () => {
    setOptions({ email: '', firstName: '', lastName: '' });
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
        <div className="col-3">
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
        <div className="col-3">
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
        <div className="col-3 d-flex gap-3">
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
