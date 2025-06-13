import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import '../styles/style.scss';

const StartTrialButton = ({ text = 'License expires today' }) => {
  return (
    <Button
      variant="outline"
      leadingIcon="premium-plan"
      onClick={() => {
        console.log('clicked');
      }}
      className="tw-expired-trial-btn"
    >
      {text}
    </Button>
  );
};

export default StartTrialButton;
