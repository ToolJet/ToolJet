import React from 'react';
import { Button } from '@/components/ui/Button/Button';

const PageOptions = ({ type, text, icon, onClick, darkMode, disabled }) => {
  return (
    <div className="field">
      <Button
        disabled={disabled}
        onClick={onClick}
        style={{ height: '30px', fontWeight: '400' }}
        className={`${darkMode ? 'page-options-dark' : ''}`}
        leadingIcon={icon}
        variant="secondary"
      >
        {text}
      </Button>
    </div>
  );
};

export default PageOptions;
