import React from 'react';
import { default as ReactPhoneInput } from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

export const PhoneInput = (props) => {
  const [value, setValue] = React.useState();
  return <ReactPhoneInput placeholder="Enter phone number" value={value} onChange={setValue} enableSearch={true} />;
};
