import React from 'react';

/*
  This small component can be used as a wrapper for all areas where we update or insert data through inputs.
  Form it self has enter for save feature. so don't need to explicitly add. 
*/
export const FormWrapper = ({ callback, id, classnames, children }) => {
  const handleSubmit = (event) => {
    event?.preventDefault();
    callback(event);
  };

  return (
    <form onSubmit={handleSubmit} noValidate id={id} className={classnames}>
      {children}
    </form>
  );
};

export const textAreaEnterOnSave = (event, callback) => {
  /* if the user needs new line in license text (less likely) then can press shift + enter */
  if (event.shiftKey && event.key === 'Enter') {
    return;
  }
  if (event.key === 'Enter') {
    event?.preventDefault();
    callback(event);
  }
};
