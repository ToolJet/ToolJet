import React from 'react';
import './resources/styles/background.styles.scss';
const WhiteLabellingBackgroundWrapper = ({ MiddleComponent }) => {
  return (
    <div className="white-labelling-background-wrapper">
      <div className="container-fluid h-100">
        {MiddleComponent && (
          <div className="row h-100">
            <div className="col-12 d-flex justify-content-center align-items-center">
              <MiddleComponent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiteLabellingBackgroundWrapper;
