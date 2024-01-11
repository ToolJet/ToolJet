import React from 'react';

/*
  This small component can be used as a wrapper for all areas where we update or insert data through inputs.
  Form it self has enter for save feature. so don't need to explicitly add. 
*/
export const FormWrapper = ({ callback, id, classnames, children }) => {
  return (
    <form onSubmit={callback} noValidate id={id} className={classnames}>
      {children}
    </form>
  );
};
