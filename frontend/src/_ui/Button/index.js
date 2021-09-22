import React from 'react';
import Button from 'react-bootstrap/Button';

const Input = ({ disabled, className, onClick, children, ...props }) => {
  return (
    <Button className={className} disabled={disabled} variant="primary" onClick={onClick} {...props}>
      {children}
    </Button>
  );
};

export default Input;
