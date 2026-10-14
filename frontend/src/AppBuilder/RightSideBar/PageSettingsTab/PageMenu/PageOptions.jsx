import React from 'react';
import { Button } from '@/components/ui/Button/Button';

// `softDisabled`: look and act disabled without the Button's own disabled state, which would also dim
// anything inside it (such as a plan lock) and swallow its tooltip.
const PageOptions = ({ type, text, icon, onClick, darkMode, disabled, softDisabled = false }) => {
  return (
    <div className="field">
      <Button
        disabled={softDisabled ? false : disabled}
        aria-disabled={softDisabled && disabled ? true : undefined}
        onClick={softDisabled && disabled ? undefined : onClick}
        style={{ height: '30px', fontWeight: '400' }}
        className={`${darkMode ? 'page-options-dark' : ''} ${softDisabled && disabled ? 'tw-cursor-not-allowed' : ''}`}
        leadingIcon={icon}
        variant="secondary"
      >
        {text}
      </Button>
    </div>
  );
};

export default PageOptions;
