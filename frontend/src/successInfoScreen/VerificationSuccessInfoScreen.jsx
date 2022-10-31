import React, { useState, useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import OnBoardingForm from '../OnBoardingForm/OnBoardingForm';
import { ButtonSolid } from '@/_components/AppButton';
import { authenticationService } from '@/_services';
import { useLocation } from 'react-router-dom';
import { LinkExpiredInfoScreen } from '@/successInfoScreen';
import { ShowLoading } from '@/_components';

export const VerificationSuccessInfoScreen = function VerificationSuccessInfoScreen() {
  const [show, setShow] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(false);
  const [userDetails, setUserDetails] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();

  const getUserDetails = () => {
    setIsLoading(true);
    authenticationService.verifyToken(location?.state?.token).then((data) => {
      setUserDetails(data);
      setIsLoading(false);
      if (data?.email !== '') {
        setVerifiedToken(true);
      }
    });
  };

  useEffect(() => {
    getUserDetails();
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="loader-wrapper verification-loader-wrap">
          <ShowLoading />
        </div>
      ) : verifiedToken ? (
        !show ? (
          <div className="page common-auth-section-whole-wrapper">
            <div className="info-screen-outer-wrap">
              <div className="info-screen-wrapper">
                <div className="verification-success-card">
                  <img
                    className="info-screen-email-img"
                    src={'assets/images/onboardingassets/Illustrations/Verification successfull.svg'}
                    alt="email image"
                  />
                  <h1 className="common-auth-section-header">Successfully verified email</h1>
                  <p className="info-screen-description">
                    Your email has been verified successfully. Continue to set up your workspace to start using ToolJet.
                  </p>
                  <ButtonSolid
                    className="verification-success-info-btn "
                    variant="primary"
                    onClick={() => {
                      setShow(true);
                    }}
                  >
                    Set up ToolJet
                    <EnterIcon fill={'#fff'}></EnterIcon>
                  </ButtonSolid>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <OnBoardingForm
            userDetails={userDetails}
            token={location?.state?.token}
            organizationToken={location?.state?.organizationToken ?? ''}
          />
        )
      ) : (
        <div className="page">
          <div className="info-screen-outer-wrap">
            {isLoading ? (
              <div className="loader-wrapper">
                <ShowLoading />
              </div>
            ) : (
              <LinkExpiredInfoScreen />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
