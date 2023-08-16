import React from 'react';
import './addNewButton.scss';

const AddNewButton = ({ children, dataCy, onClick, className = '' }) => {
  return (
    <button className={`add-new-btn ${className}`} onClick={onClick} data-cy={dataCy}>
      {children}
    </button>
  );
};

export default AddNewButton;
