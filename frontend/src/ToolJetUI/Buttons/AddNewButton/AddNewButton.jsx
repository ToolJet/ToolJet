import React from 'react';
import './addNewButton.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const AddNewButton = ({ children, dataCy, onClick, className = '', isLoading }) => {
  return (
    <ButtonSolid
      variant="ghostBlack"
      size="md"
      className={`add-new-btn ${className}`}
      onClick={onClick}
      data-cy={dataCy}
      leftIcon="plusrectangle"
      fill={'#ACB2B9'}
      iconWidth={16}
      isLoading={isLoading}
    >
      {children}
    </ButtonSolid>
  );
};

export default AddNewButton;
