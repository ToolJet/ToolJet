import React from 'react';

const FormHeader = ({ children: View, styles, dataCy }) => {
  const defaultDataCy = View?.toString()?.toLowerCase().replace(/\s+/g, '-');
  const computedDataCy = dataCy || defaultDataCy;
<<<<<<< HEAD

  return (
    <h2 className="form-header" style={styles} data-cy={`${computedDataCy}-header`}>
      {View}
    </h2>
=======
  return (
    <>
      <h2 className="form-header" style={styles} data-cy={`${computedDataCy}-header`}>
        {View}
      </h2>
    </>
>>>>>>> main
  );
};

export default FormHeader;
