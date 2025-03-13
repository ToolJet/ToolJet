import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { validateEmail, validatePassword } from '@/_helpers/utils';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import {
  FormTextInput,
  PasswordInput,
  SubmitButton,
  FormHeader,
  SSOAuthModule,
  TermsAndPrivacyInfo,
} from '@/modules/common/components';
import SignupStatusCard from './components/SignupStatusCard';
import './resources/styles/sign-up-form.styles.scss';
import SepratorComponent from '@/modules/common/components/SepratorComponent';

const SignupForm = ({
  configs,
  organizationId,
  paramOrganizationSlug,
  organizationToken,
  inviteeEmail,
  redirectTo,
  onSubmit,
  setSignupOrganizationDetails,
  initialData,
  defaultState,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isDefaultFormName, setisDefaultFormName] = useState(true);
  const [isDefaultFormEmail, setisDefaultFormEmail] = useState(true);
  const [isDefaultFormPassword, setisDefaultFormPassword] = useState(true);
  const isAnySSOEnabled =
    configs?.google?.enabled ||
    configs?.git?.enabled ||
    configs?.ldap?.enabled ||
    configs?.saml?.enabled ||
    configs?.openid?.enabled;

  const isFormSignUpEnabled = organizationId ? configs?.form?.enabled : configs?.form?.enable_sign_up;
  const shouldShowSignInCTA = !organizationToken;
  const comingFromInviteFlow = !!organizationToken;
  const shouldShowSignupDisabledCard = !organizationToken && !configs?.enable_sign_up && !configs?.form?.enable_sign_up;
  const signUpDisabledText = `Signup has been disabled by your ${organizationId ? 'workspace' : 'super'} admin.`;
  const defaultfieldStateSetters = {
    name: setisDefaultFormName,
    email: setisDefaultFormEmail,
    password: setisDefaultFormPassword,
  };
  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, password: '' });
    }
    if (inviteeEmail) {
      setFormData((prev) => ({ ...prev, email: inviteeEmail }));
    }
  }, [initialData, inviteeEmail]);

  const checkFormValidity = () => {
    const isValid =
      formData.email.trim() !== '' &&
      validateEmail(formData.email) &&
      formData.password.trim() !== '' &&
      formData.password.length >= 5 &&
      (comingFromInviteFlow || formData.name.trim() !== '');
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (defaultfieldStateSetters[name]) {
      defaultfieldStateSetters[name](false);
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
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
  const formInputFields = {
    name: isDefaultFormName,
    email: isDefaultFormEmail,
    password: isDefaultFormPassword,
  };
  useEffect(() => {
    const newErrors = {};
    let fieldsValid = true;
    Object.keys(formData).forEach((fieldName) => {
      // only if the field is edited by the user -- after that we show validation error message
      const fieldError = !formInputFields[fieldName] && validateField(fieldName, formData[fieldName]);
      newErrors[fieldName] = fieldError;
      if (fieldError) fieldsValid = false;
    });
    setErrors(newErrors);
    // form validity -> used for checking all the validation checks in the form
    const isFormValid = fieldsValid && checkFormValidity();
    setIsFormValid(isFormValid);
  }, [formData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (validateForm()) {
      onSubmit(
        formData,
        () => {
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!comingFromInviteFlow && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters long';
    }
    if (formData.password.length > 100) {
      newErrors.password = 'Password can be at max 100 characters long';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="signup-form">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          <FormHeader>{t('loginSignupPage.signUp', 'Sign up')}</FormHeader>
          {(organizationId || shouldShowSignInCTA) && (
            <p className="signup-info" data-cy="signup-info">
              {organizationId && (
                <>
                  Sign up to the workspace - <span className="workspace-name">{configs?.name}</span>.
                </>
              )}{' '}
              {shouldShowSignInCTA && (
                <>
                  {t('loginSignupPage.alreadyHaveAnAccount', 'Already have an account?')}{' '}
                  <Link
                    to={`/login${paramOrganizationSlug ? `/${paramOrganizationSlug}` : ''}${
                      redirectTo ? `?redirectTo=${redirectTo}` : ''
                    }`}
                    className="signin-link"
                    tabIndex="-1"
                    data-cy="signin-link"
                  >
                    {t('loginSignupPage.signIn', 'Sign in')}
                  </Link>
                </>
              )}
            </p>
          )}
          {shouldShowSignupDisabledCard ? (
            <SignupStatusCard text={signUpDisabledText} />
          ) : (
            <>
              {isFormSignUpEnabled && (
                <form onSubmit={handleSubmit} className="form-input-area">
                  {!comingFromInviteFlow && (
                    <FormTextInput
                      label={t('loginSignupPage.name', 'Name')}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('loginSignupPage.enterFullName', 'Enter your full name')}
                      error={errors.name}
                    />
                  )}
                  <FormTextInput
                    label={t('loginSignupPage.workEmail', 'Email')}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
                    error={errors.email}
                    disabled={!!inviteeEmail}
                  />
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    error={errors.password}
                    label={organizationToken ? 'Create a password' : 'Password'}
                  />
                  <SubmitButton
                    buttonText={t('loginSignupPage.signUp', 'Sign up')}
                    disabled={!isFormValid || isLoading}
                    isLoading={isLoading}
                  />
                </form>
              )}
              {isAnySSOEnabled && isFormSignUpEnabled && <SepratorComponent />}
              <SSOAuthModule
                configs={configs}
                organizationSlug={paramOrganizationSlug}
                buttonText="Sign up with"
                setSignupOrganizationDetails={() => setSignupOrganizationDetails()}
              />
              {defaultState && <TermsAndPrivacyInfo />}
            </>
          )}
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default SignupForm;
