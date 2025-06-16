import React from 'react';
import { Button } from '@/components/ui/Button/Button';

const PageOptions = ({ type, text, icon, onClick, darkMode }) => {
  return (
    <div className="field">
      <Button onClick={onClick} style={{ height: '30px', fontWeight: '400' }} leadingIcon={icon} variant="secondary">
        {text}
      </Button>
    </div>
  );
};

export default PageOptions;
