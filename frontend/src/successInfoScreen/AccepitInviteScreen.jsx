import React, { useState } from 'react';
import OnboardingNavbar from '../_components/OnboardingNavbar';
import OnboardingCta from '../_components/OnboardingCta';
import { ButtonSolid } from '../_components/AppButton';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import Spinner from '@/_ui/Spinner';
function AccepitInviteScreen() {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="page common-auth-section-whole-wrapper">
      <div className="common-auth-section-left-wrapper">
        <OnboardingNavbar />
        <div className="common-auth-section-left-wrapper-grid">
          <div></div>

          <form action="." method="get" autoComplete="off">
            <div className="common-auth-container-wrapper">
              <h2 className="common-auth-section-header">Join Workspace</h2>

              <div className="signup-page-signin-redirect">
                You are invited to a workspace by username. Accept the invite to joing the org
              </div>

              <div className="signup-page-inputs-wrapper">
                <label className="tj-text-input-label">Name</label>
                <p className="accept-invite-data">Jaseem Aslam</p>
              </div>

              <div className="signup-inputs-wrap">
                <label className="tj-text-input-label">Work email</label>
                <p className="accept-invite-data">jaseem@tooljet.io</p>
              </div>

              <div>
                <ButtonSolid
                  className="signup-btn"
                  //   onClick={this.signup}
                >
                  {isLoading ? (
                    <div className="spinner-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <span> Accept invite</span>
                      <EnterIcon className="enter-icon-onboard" />
                    </>
                  )}
                </ButtonSolid>
              </div>
              <p className="">
                By Signing up you are agreeing to the
                <br />
                <span>
                  <a href="https://www.tooljet.com/terms">Terms of Service &</a>
                  <a href="https://www.tooljet.com/privacy"> Privacy Policy.</a>
                </span>
              </p>
            </div>
          </form>
          <div></div>
        </div>
      </div>

      <div className="common-auth-section-right-wrapper">
        <OnboardingCta isLoading={false} />
      </div>
    </div>
  );
}

export default AccepitInviteScreen;
