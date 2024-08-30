import React, { useEffect, useState } from 'react';
import DefaultPricing from './resources/images/pricing-default.svg';
import './resources/styles/pricing-component.styles.scss';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store';
import { shallow } from 'zustand/shallow';
import { toast } from 'react-hot-toast';
import { utils } from '@/modules/common/helpers';
import { ComparePlans } from './components';

const PricingComponent = () => {
  const { fetchLicensePlans, startTrial } = useOnboardingStore(
    (state) => ({
      fetchLicensePlans: state.fetchLicensePlans,
      startTrial: state.startTrial,
    }),
    shallow
  );
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansResponse = await fetchLicensePlans();
        setPlans(plansResponse.plans);
      } catch (error) {
        const errMessage = utils.processErrorMessage(error);
        toast.error(errMessage);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgrade = async (planId) => {
    window.open('https://www.tooljet.com/pricing?payment=onpremise', '_blank');
  };

  const handleScheduleCall = async () => {
    window.open('https://www.tooljet.com/schedule-demo', '_blank');
  };

  const handleTrialRequest = async () => {
    try {
      await startTrial();
    } catch (error) {
      const errorMsg = utils.processErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="pricing-component">
      {plans && plans.plans && plans.currentPlan ? (
        <ComparePlans
          plans={plans.plans}
          currentPlan={plans.currentPlan}
          onUpgrade={handleUpgrade}
          onScheduleCall={handleScheduleCall}
          onStartTrial={handleTrialRequest}
        />
      ) : (
        <>
          <DefaultPricing />
        </>
      )}
    </div>
  );
};

export default PricingComponent;
