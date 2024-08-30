import React, { useEffect } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import useInvitationsStore from '@/modules/onboarding/stores/invitations.store';
import toast from 'react-hot-toast';
import { useEnterKeyPress } from '@/modules/common/hooks';

const SampleAppIntroduction = () => {
  const { completeOnboarding } = useInvitationsStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const TITLE = "We've created a sample application for you!";
  const description =
    'The sample application comes with a sample PotsgreSQL database for you to play around with. You can also get started quickly with pre-built applications from our template collection!';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setIsSubmitting(true);
      await completeOnboarding();
      setIsSubmitting(false);
    } catch (error) {
      toast.error(error?.error || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  useEnterKeyPress(() => handleSubmit());

  return (
    <OnboardingForm
      title={TITLE}
      description={description}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Continue"
      isFormValid={true}
    >
      {/* No additional form fields needed for this step */}
    </OnboardingForm>
  );
};

export default SampleAppIntroduction;
