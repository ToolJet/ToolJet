import React from 'react';
import { Button } from '@/components/ui/Button/Button';

const StartTrialButton = ({ text = 'Start Trial' }) => {
  return (
    <Button
      variant="outline"
      leadingIcon="premium-plan"
      onClick={() => {
        console.log('clicked');
      }}
    >
      {text}
    </Button>
  );
};

export default StartTrialButton;
