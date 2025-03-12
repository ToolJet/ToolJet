import React, { useState, useEffect } from 'react';
import { OnboardingUIWrapper } from '@/modules/onboarding/components';
import {
  FormTextInput,
  PasswordInput,
  SubmitButton,
  FormHeader,
  EmailComponent,
  TermsAndPrivacyInfo,
} from '@/modules/common/components';
import useOnboardingStore from '@/modules/common/helpers/onboardingStoreHelper';
import { shallow } from 'zustand/shallow';
import { validateEmail, validatePassword } from '@/_helpers/utils';
import './resources/styles/setup-admin-form.styles.scss';
import { useEnterKeyPress } from '@/modules/common/hooks';

const SetupAdminForm = () => {
  const { setAdminDetails, nextStep, adminDetails, accountCreated } = useOnboardingStore(
    (state) => ({
      setAdminDetails: state.setAdminDetails,
      nextStep: state.nextStep,
      adminDetails: state.adminDetails,
      accountCreated: state.accountCreated,
    }),
    shallow
  );
  const [formData, setFormData] = useState(adminDetails);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const formAreaStyles = {
    marginTop: '24px',
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setTouchedFields((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
  };
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'email':
        return value.trim() ? (validateEmail(value) ? '' : 'Email is invalid') : 'Email is required';
      case 'password':
        return validatePassword(value);
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
    e?.preventDefault();
    if (isFormValid) {
      setAdminDetails(formData);
      nextStep();
    }
  };
  useEnterKeyPress(() => handleSubmit());
  return (
    <OnboardingUIWrapper>
      <div className="onboarding-form-width">
        <FormHeader>Set up your admin account</FormHeader>
        <form onSubmit={handleSubmit} className="form-input-area" style={formAreaStyles}>
          <FormTextInput
            label="Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            error={touchedFields.name ? errors.name : ''}
            disabled={accountCreated}
            name="name"
            dataCy="name-input"
          />
          <FormTextInput
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your work email"
            error={touchedFields.email ? errors.email : ''}
            dataCy="email-input"
            disabled={accountCreated}
          />
          <PasswordInput
            value={formData.password}
            onChange={handleChange}
            error={touchedFields.password ? errors.password : ''}
            name="password"
            dataCy="password-input"
            disabled={accountCreated}
          />
          <SubmitButton buttonText="Sign up" disabled={!isFormValid} />
          <TermsAndPrivacyInfo />
        </form>
      </div>
    </OnboardingUIWrapper>
  );
};

export default SetupAdminForm;
