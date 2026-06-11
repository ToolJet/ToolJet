import React from 'react';

const OnboardingFormInsideWrapper = ({ children: components }) => {
  const styles = {
    width: '308px',
  };

  return <div style={styles}>{components}</div>;
};

export default OnboardingFormInsideWrapper;
