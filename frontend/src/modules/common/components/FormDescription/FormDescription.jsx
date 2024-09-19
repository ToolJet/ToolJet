import React from 'react';
import './resources/styles/form-description.styles.scss';

const FormDescription = ({ children: View }) => {
  return (
    <>
      <p className="onboarding-form-description">{View}</p>
    </>
  );
};

export default FormDescription;
