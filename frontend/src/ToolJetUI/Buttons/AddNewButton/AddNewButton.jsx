import React from 'react';
import './addNewButton.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const AddNewButton = ({ children, dataCy, onClick, className = '' }) => {
  return (
    <ButtonSolid variant="tertiary" size="md" className={`add-new-btn ${className}`} onClick={onClick} data-cy={dataCy}>
      {children}
    </ButtonSolid>
  );
};

export default AddNewButton;
