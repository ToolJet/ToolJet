import * as React from 'react';

import Logo from '@/modules/common/resources/images/Logo';

export const FormWrapper = ({ children }) => {
  return (
    <div className="tw-flex tw-flex-col tw-gap-9">
      <Logo />
      {children}
    </div>
  );
};
