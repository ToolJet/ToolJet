import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import '../styles/style.scss';

const StartTrialButton = ({ text = 'Start Trial' }) => {
  return (
    <Button
      variant="outline"
      leadingIcon="bookdemo"
      onClick={() => {
        console.log('clicked');
      }}
      className="tw-consultation-btn"
    >
      {text}
    </Button>
  );
};

export default StartTrialButton;
