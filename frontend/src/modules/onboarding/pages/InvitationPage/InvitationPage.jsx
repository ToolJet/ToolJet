import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { verifyToken, onboarding } from '@/modules/onboarding/services/onboarding.service';
import { toast } from 'react-hot-toast';
import { OnboardingQuestions } from '@/modules/onboarding/components';
import invitationsStore from '@/modules/onboarding/stores/invitationsStore';
import { LinkExpiredPage } from '@/ConfirmationPage/LinkExpiredPage';
import { utils } from '@/modules/common/helpers';
import { getSubpath } from '@/_helpers/routes';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import useOnboardingStore from '@/modules/common/helpers/onboardingStoreHelper';
import useInvitationsStore from '@/modules/common/helpers/invitationStoreHelper';

const PostOnboardingComponent = () => <TJLoader />;
export const InvitationPage = (darkMode = false) => {
  const [isLoading, setIsLoading] = useState(true);
  const [fallBack, setFallBack] = useState(false);

  const location = useLocation();
  const params = useParams();
  const searchParams = new URLSearchParams(location?.search);

  const organizationId = searchParams.get('oid');
  const organizationToken = searchParams.get('organizationToken') || params?.organizationToken;
  const source = searchParams.get('source');
  const redirectTo = searchParams.get('redirectTo');

  const { initiateInvitedUserOnboarding } = useInvitationsStore();
  const { resumeSignupOnboarding, isOnboardingStepsCompleted } = useOnboardingStore();
  useEffect(() => {
    // getUserDetails();
    resumeSignupOnboarding((resumeOnboardingSession) => {
      if (!resumeOnboardingSession) getUserDetails();
      else {
        initiateInvitedUserOnboarding(
          {
            source,
            organizationId,
            redirectTo,
          },
          true
        );
        setIsLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserDetails = () => {
    setIsLoading(true);
    const token = params?.token;
    verifyToken(token, organizationToken)
      .then((data) => {
        const shouldShowOnboardingQuestions = data?.onboarding_details?.questions;
        if (shouldShowOnboardingQuestions) {
          initiateInvitedUserOnboarding({
            inviteeEmail: data?.email,
            token,
            organizationToken,
            source,
            organizationId,
            redirectTo,
          });
          setIsLoading(false);
        } else {
          onboarding({
            companyName: '',
            buildPurpose: '',
            token,
            organizationToken,
            source,
          }).then((data) => {
            const toGo = redirectTo || '/';
            const path = getSubpath() ? `${getSubpath()}${toGo}` : `${toGo}`;
            window.location.href = path;
          });
        }
      })
      .catch((error) => {
        const errMessage = utils.processErrorMessage(error);
        toast.error(errMessage, { position: 'top-center' });
        setIsLoading(false);
        setFallBack(true);
      });
  };

  if (isLoading) {
    return <></>;
  }

  if (fallBack) {
    return <LinkExpiredPage />;
  }

  if (isOnboardingStepsCompleted && PostOnboardingComponent) return <PostOnboardingComponent />;

  if (!isLoading) return <OnboardingQuestions />;
};

export default InvitationPage;
