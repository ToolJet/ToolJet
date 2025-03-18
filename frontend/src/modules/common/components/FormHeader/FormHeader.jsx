import React from 'react';

const FormHeader = ({ children: View, styles, dataCy }) => {
  return (
    <>
      <h2 className="form-header" style={styles} data-cy={dataCy}>
        {View}
      </h2>
    </>
  );
};

export default FormHeader;
