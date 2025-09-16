import React from 'react';
import { Button } from '@/components/ui/button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const GitHubSigninButton = ({ onClick, icon, text, dataCy }) => {
  return (
    <Button
      onClick={onClick}
      data-cy={dataCy}
      type="button"
      variant="outline"
      size="large"
      className="tw-justify-center"
    >
      <SolidIcon name="github" />
      <span className="sso-text" data-cy={`${dataCy}-text`}>
        {text}
      </span>
    </Button>
  );
};
