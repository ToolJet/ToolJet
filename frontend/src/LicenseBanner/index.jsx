import React, { useState } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getDateDifferenceInDays } from '@/_helpers/utils';
import { ProgressBar } from '../_ui/ProgressBar';
import LegalReasonsErrorModal from '../_components/LegalReasonsErrorModal';
import { copyToClipboard } from '@/_helpers/appUtils';
import { authenticationService } from '@/_services';

const TRIAL_DAYS_LIMIT = 14;

export function LicenseBanner({
  limits = {},
  type,
  classes,
  size = 'large',
  customMessage = '',
  children,
  isAvailable,
  style = {},
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const currentUser = authenticationService.currentSessionValue;
  const { percentage = '', total, current, licenseStatus } = limits ?? {};
  const { isExpired, isLicenseValid, licenseType, expiryDate } = licenseStatus ?? {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isWorkspaceAdmin = !currentUser.super_admin && currentUser.admin;
  const isEndUser = !currentUser.admin;
  const DEMO_LINK = 'https://www.tooljet.com/pricing?utm_source=banner&utm_medium=plg&utm_campaign=none';

  const features = ['Instance Settings', 'Audit Log', 'Open ID Connect'];

  const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(expiryDate));

  const generateWarningText = () => {
    switch (true) {
      case !isExpired &&
        (percentage >= 90 || (total <= 10 && current === total - 1)) &&
        isEndUser &&
        (type === 'workspaces' || type === 'apps') &&
        !currentUser.super_admin:
        return {
          text: 'Uh Oh!',
          className: 'warning-text',
          parentClassName: 'warning-header-container',
        };
      default:
        return null;
    }
  };

  const generateMessage = () => {
    switch (true) {
      case Object.keys(limits).length === 0:
        return '';
      case !currentUser.admin && size === 'large':
        return '';
      case isExpired && type === 'enterprise':
        return 'Your license has expired';
      case isExpired && type === 'trial':
        return 'Your trial has expired';
      case isLicenseValid && licenseType === 'trial' && daysLeft > 3 && type === 'trial': {
        return `Your ${daysLeft}-day trial has started.`;
      }
      case isLicenseValid && licenseType === 'trial' && daysLeft < 14 && type === 'trial': {
        return `Your trial ends in ${daysLeft} days.`;
      }
      case isLicenseValid && licenseType === 'enterprise' && daysLeft <= 14 && type === 'enterprise': {
        return `Your license expires in ${daysLeft} days!`;
      }
      case type == 'tables' && (100 > percentage >= 90 || (total <= 10 && current === total - 1)):
        return `You're reaching your limit for number of ${type} - ${current}/${total}.`;
      case type == 'tables' && percentage >= 100:
        return `You've reached your limit for number of ${type} - ${current}/${total}.`;
      case (isExpired || !isLicenseValid || licenseType === 'trial') && type === 'super admins': {
        return `You've reached your limit for number of ${type}.`;
      }
      case !isExpired && percentage >= 100:
        return `You have reached your limit for number of ${type}.`;
      case !isExpired && (percentage >= 90 || (total <= 10 && current === total - 1)):
        return `You're reaching your limit for number of ${type} - ${current}/${total}.`;
      case (!isLicenseValid || isExpired) && features.includes(type) && !isAvailable:
        return `You cannot access ${type}.`;
      default:
        return '';
    }
  };

  const generateInfo = () => {
    switch (true) {
      case !isLicenseValid || licenseType === 'basic' || (licenseType === 'trial' && (isEndUser || isWorkspaceAdmin)):
        return `Contact superadmin to keep leveraging ToolJet to the fullest!`;
      case !isLicenseValid || licenseType === 'basic' || licenseType === 'trial':
        return `Unlock ToolJet's full potential by upgrading to one of our paid plans.`;
      case isExpired && licenseType === 'enterprise':
        return `To continue enjoying the full benefits of ToolJet, renew your subscription.`;
      default:
        return '';
    }
  };

  const generateButtonTextAndLink = () => {
    switch (true) {
      case (size === 'xsmall' || size === 'small') &&
        (type === 'trial' || type === 'basic' || type === 'enterprise' || type === 'apps' || type === 'workspaces') &&
        (isEndUser || isWorkspaceAdmin):
        return {
          text: 'Contact superadmin for more',
          className: 'sub-heading',
          replaceText: true,
        };

      case (size === 'xsmall' || size === 'small') && !currentUser.super_admin:
        return {
          text: 'Contact superadmin to keep leveraging ToolJet to the fullest!',
          className: 'sub-heading',
          replaceText: true,
        };
      case isExpired && (type === 'basic' || type === 'trial'):
        return {
          text: 'Upgrade',
          onClick: () => {
            window.open(DEMO_LINK, '_blank');
          },
        };
      case !isExpired && (percentage >= 90 || (total <= 10 && current === total - 1) || percentage >= 100):
        return {
          text: 'Upgrade',
          onClick: () => {
            window.open(DEMO_LINK, '_blank');
          },
        };
      case (isExpired || daysLeft < 14) && type === 'enterprise':
        return {
          text: 'Renew',
          onClick: () => {
            setIsModalOpen(true);
          },
        };
      default:
        return {
          text: 'Upgrade',
          onClick: () => {
            window.open(DEMO_LINK, '_blank');
          },
        };
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const warningText = generateWarningText();
  const message = customMessage || generateMessage();
  const buttonTextAndnClick = generateButtonTextAndLink();
  const { onClick: handleClick, text: buttonText, className, replaceText } = buttonTextAndnClick;

  const iconSize = {
    width: size === 'small' ? '40px' : '48px',
  };

  const modalBody = (
    <div className="form-group my-3">
      <div className="d-flex justify-content-between form-control align-items-center">
        <p className="m-0" id="support-email">
          hello@tooljet.com
        </p>
        <SolidIcon name="copy" width="16" onClick={() => copyFunction('support-email')} />
      </div>
    </div>
  );

  return currentUser.admin && message ? (
    <div style={{ ...style }} className={`license-banner d-flex ${classes}`}>
      {!warningText && currentUser.admin && (
        <SolidIcon {...iconSize} fill={darkMode ? '#3F2200' : '#FFEDD4'} name="enterpriseGradient" />
      )}
      <div className="message-wrapper">
        <div className={`heading ${warningText?.parentClassName}`}>
          {warningText && <div className={warningText?.className}>{warningText?.text}</div>}
          {message}{' '}
          {size === 'small' && (
            <div className={`cursor-pointer ${className}`}>
              {!replaceText ? (
                <>
                  {!replaceText && 'For more, '}
                  <span
                    onClick={handleClick}
                    className={`${currentUser?.super_admin && 'upgrade-link'} cursor-pointer ${className} `}
                  >
                    {buttonText}
                  </span>
                </>
              ) : (
                <span onClick={handleClick}>{buttonText}</span>
              )}
            </div>
          )}
          {size === 'xsmall' && (
            <span
              onClick={handleClick}
              className={`${currentUser?.super_admin && 'upgrade-link'} cursor-pointer ${className} `}
            >
              {buttonText}
            </span>
          )}
        </div>
        {size === 'large' && (
          <span>
            {generateInfo() ||
              `To continue enjoying the full benefits of ToolJet, ${buttonText.toLowerCase()} your subscription.`}
          </span>
        )}
        {type === licenseType && daysLeft <= 14 && !isExpired && (
          <ProgressBar
            parentStyles={{ width: size === 'xsmall' ? '100%' : '50%' }}
            value={TRIAL_DAYS_LIMIT - daysLeft}
            max={TRIAL_DAYS_LIMIT}
            classes="mt-2"
          />
        )}
      </div>
      {size === 'large' && currentUser.super_admin && (
        <button onClick={handleClick} className="tj-base-btn upgrade-btn">
          {buttonText}
        </button>
      )}
      {isModalOpen && (
        <LegalReasonsErrorModal
          showModal={isModalOpen}
          showFooter={false}
          type={buttonText}
          message={`To ${buttonText.toLocaleLowerCase()} your plan, please reach out to us at`}
          body={modalBody}
          darkMode={darkMode}
          toggleModal={toggleModal}
        />
      )}
    </div>
  ) : (
    <>{children}</>
  );
}
