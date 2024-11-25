import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authenticationService } from '@/_services';
import { OnboardingUIWrapper, OnboardingFormInsideWrapper } from '@/modules/onboarding/components';
import { PasswordInput, SubmitButton, FormHeader } from '@/modules/common/components';
import './resources/styles/reset-password-form.styles.scss';

const ResetPasswordForm = ({ token, onResetSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setisFormValid] = useState(false);

  const password_comparison_check = (formData) => {
    if (
      formData.password.length >= 5 &&
      formData.password.length <= 100 &&
      formData.password_confirmation.length >= 5
    ) {
      if (formData.password_confirmation === formData.password) {
        delete errors.password_confirmation;
        delete errors.password;
        return true;
      } else {
        let newErrors = { ...errors };
        newErrors.password_confirmation = "Passwords don't match";
        setErrors(newErrors);
      }
    }
    return false;
  };
  useEffect(() => {
    if (
      formData.password != '' &&
      formData.password_confirmation != '' &&
      password_comparison_check(formData) &&
      Object.keys(errors).length === 0
    ) {
      setisFormValid(true);
    } else {
      setisFormValid(false);
    }
  }, [formData]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };
  const validateField = (name, value) => {
    let newErrors = { ...errors };
    if (name === 'password') {
      if (value.length < 5) {
        newErrors.password = 'Password should be at least 5 characters';
      } else if (value.length > 100) {
        newErrors.password = 'Password should be max 100 characters';
      } else {
        delete newErrors.password;
      }
    }
    if (name === 'password_confirmation') {
      if (value !== formData.password) {
        newErrors.password_confirmation = "Passwords don't match";
      } else {
        delete newErrors.password_confirmation;
      }
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      try {
        await authenticationService.resetPassword({ ...formData, token });
        toast.success('Password reset successfully');
        onResetSuccess();
      } catch (error) {
        toast.error(error.error || 'Something went wrong, please try again');
      } finally {
        setIsLoading(false);
      }
    }
  };
  return (
    <div className="reset-password-form">
      <OnboardingUIWrapper>
        <OnboardingFormInsideWrapper>
          <FormHeader>{t('Reset Password')}</FormHeader>
          <span className="free-space"></span>
          <form onSubmit={handleSubmit}>
            <PasswordInput
              name="password"
              label={t('New Password')}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              dataCy="new-password-input"
            />
            <PasswordInput
              name="password_confirmation"
              label={t('Re-enter the password')}
              value={formData.password_confirmation}
              onChange={handleChange}
              error={errors.password_confirmation}
              dataCy="confirm-password-input"
              placeholder={t('Re-enter the password')}
            />
            <SubmitButton buttonText={t('Reset password')} isLoading={isLoading} disabled={isLoading || !isFormValid} />
          </form>
        </OnboardingFormInsideWrapper>
      </OnboardingUIWrapper>
    </div>
  );
};

export default ResetPasswordForm;
