import React, { useState, useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
import { ButtonSolid } from '@/_components/AppButton';

function SetupScreenSelfHost() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="sh-setup-screen-wrapper">
      <div className="sh-setup-banner">
        <div className="sh-setup-sub-banner"></div>
        <div className="sh-setup-card">
          <img src="assets/images/onboardingassets/Illustrations/Dots.svg" />

          <h1>
            Hello,
            <br /> Welcome to <br />
            <span>ToolJet!</span>
          </h1>
          <p>Let’s set up your workspace to get started with ToolJet</p>
          <ButtonSolid
            className="sh-setup-button"
            onClick={(e) => this.acceptInvite(e)}
            //   disabled={
            //     isLoading ||
            //     (userDetails?.onboarding_details?.password && (!this.state?.password || this.state?.password?.length < 5))
            //   }
            data-cy="accept-invite-button"
          >
            {isLoading ? (
              <div className="spinner-center">
                <Spinner />
              </div>
            ) : (
              <>
                <span>Setup ToolJet</span>
                <EnterIcon className="enter-icon-onboard" />
              </>
            )}
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
}

export default SetupScreenSelfHost;
