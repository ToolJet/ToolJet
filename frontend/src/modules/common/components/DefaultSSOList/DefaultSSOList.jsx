import React from 'react';
const DefaultSSOList = ({ renderSSOOption }) => {
  return (
    <div>
      {renderSSOOption('google', 'Google')}
      {renderSSOOption('git', 'GitHub')}
    </div>
  );
};

export default DefaultSSOList;
