import React from 'react';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
function OnboardingPassword({ setFormData, formData, fieldType }) {
  return (
    <div>
      <input
        name="password"
        onChange={(e) => setFormData({ ...formData, [fieldType]: e.target.value })}
        //   type={this.state?.showPassword ? 'text' : 'password'}
        className="onboard-input"
        //   placeholder={this.props.t('onboardingSignupPage.EnterPassword', 'Enter password')}
        autoComplete="off"
      />

      <div className="onboarding-password-hide-img">
        {/* onClick={this.handleOnCheck} */}
        {/* {this.state?.showPassword ? (
            <EyeHide
              fill={
                this.darkMode
                  ? this.state?.password?.length
                    ? '#D1D5DB'
                    : '#656565'
                  : this.state?.password?.length
                  ? '#384151'
                  : '#D1D5DB'
              }
            />
          ) : (
            <EyeShow
              fill={
                this.darkMode
                  ? this.state?.password?.length
                    ? '#D1D5DB'
                    : '#656565'
                  : this.state?.password?.length
                  ? '#384151'
                  : '#D1D5DB'
              }
            />
          )} */}
      </div>
    </div>
  );
}

export default OnboardingPassword;
