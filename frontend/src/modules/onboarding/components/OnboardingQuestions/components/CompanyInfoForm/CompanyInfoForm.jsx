import React, { useState, useEffect } from 'react';
import { OnboardingForm } from '@/modules/onboarding/components';
import { FormTextInput } from '@/modules/common/components';
import { FormTextareaInput } from './components';
import useOnboardingStore from '@/modules/onboarding/stores/onboarding.store.js';
import { shallow } from 'zustand/shallow';

const CompanyInfoForm = () => {
  const { nextStep, setCompanyInfo, companyInfo, accountCreated } = useOnboardingStore(
    (state) => ({
      nextStep: state.nextStep,
      setCompanyInfo: state.setCompanyInfo,
      companyInfo: state.companyInfo,
      accountCreated: state.accountCreated,
    }),
    shallow
  );

  const [formData, setFormData] = useState(companyInfo);
  const [errors, setErrors] = useState({
    companyName: '',
    buildPurpose: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    companyName: false,
    buildPurpose: false,
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const TITLE = 'Tell us a bit about yourself';
  const description = 'This information will help us improve ToolJet';

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setTouchedFields((prevTouched) => ({ ...prevTouched, [name]: true }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'companyName':
        return value.trim() ? '' : 'Company name is required';
      case 'buildPurpose':
        return value.trim() ? '' : 'Please tell us what you would like to build, this will help us improve ToolJet';
      default:
        return '';
    }
  };

  useEffect(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((fieldName) => {
      const fieldError = validateField(fieldName, formData[fieldName]);
      newErrors[fieldName] = fieldError;
      if (fieldError) isValid = false;
    });

    setErrors(newErrors);
    setIsFormValid(isValid && Object.values(formData).every(Boolean));
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      setCompanyInfo(formData);
      nextStep();
    }
  };

  return (
    <OnboardingForm
      title={TITLE}
      description={description}
      onSubmit={handleSubmit}
      isSubmitting={false}
      isFormValid={isFormValid}
    >
      <FormTextInput
        label="Company name"
        placeholder="Enter company name"
        value={formData.companyName}
        onChange={(e) => handleInputChange('companyName', e.target.value)}
        name="companyName"
        error={touchedFields.companyName ? errors.companyName : ''}
        dataCy="onboarding-company-name"
        disabled={accountCreated}
        maxLength={50}
      />
      <FormTextareaInput
        label="What would you like to build on ToolJet?"
        placeholder="Eg. Build a custom application to meet business needs"
        value={formData.buildPurpose}
        onChange={(e) => handleInputChange('buildPurpose', e.target.value)}
        name="buildPurpose"
        error={touchedFields.buildPurpose ? errors.buildPurpose : ''}
        dataCy="onboarding-build-purpose"
        disabled={accountCreated}
      />
    </OnboardingForm>
  );
};

export default CompanyInfoForm;
