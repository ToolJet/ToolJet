import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { getDateDifferenceInDays } from '@/_helpers/utils';
import { ProgressBar } from '../_ui/ProgressBar';
import LegalReasonsErrorModal from '../_components/LegalReasonsErrorModal';
import { copyToClipboard } from '@/_helpers/appUtils';
import { authenticationService, licenseService } from '@/_services';
import moment from 'moment';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';

const TRIAL_DAYS_LIMIT = 14;

export function LicenseBannerCloud({
  limits = {},
  type,
  classes,
  size = 'large',
  customMessage = '',
  children,
  isAvailable,
  style = {},
  showPaidFeatureBanner = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const currentUser = authenticationService.currentSessionValue;
  const { percentage = '', total, current, licenseStatus, canAddUnlimited } = limits ?? {};
  const { isExpired, isLicenseValid, licenseType, expiryDate, startDate } = licenseStatus ?? {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isWorkspaceAdmin = currentUser.admin;
  const isEndUser = !currentUser.admin;
  const DEMO_LINK = `https://www.tooljet.com/pricing?utm_source=banner&utm_medium=plg&utm_campaign=none&payment=tooljet-cloud&workspace_id=${currentUser.current_organization_id}`;

  const features = ['Instance Settings', 'Audit Log', 'Open ID Connect'];

  const boldWords = [
    'Edit user details',
    'number of super admins',
    'paid plans',
    'expired',
    'days',
    'today',
    'ended',
    'tables',
    'permissions',
    'data source permissions',
    'Custom groups & permissions',
    'Instance settings',
    'White labelling',
    'Custom styles',
  ];

  const upgradeEventTrack = () => {
    posthog.capture('click_upgrade_plan', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
    });
  };

  const renewEventTrack = () => {
    posthog.capture('click_renew_plan', {
      workspace_id:
        authenticationService?.currentUserValue?.organization_id ||
        authenticationService?.currentSessionValue?.current_organization_id,
    });
  };

  const applyBoldFormatting = (text) => {
    const boldRegex = new RegExp(`\\b(${boldWords.join('|')}|\\d+)\\b`, 'g');
    return text.split(boldRegex).map((word, index) => {
      if (boldWords.includes(word) || /^\d+$/.test(word)) {
        return (
          <span key={index} className="bold-text">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const daysLeft = expiryDate && getDateDifferenceInDays(new Date(), new Date(expiryDate));
  const totalTrialDays = expiryDate && startDate && getDateDifferenceInDays(new Date(expiryDate), new Date(startDate));
  const iscurrentDate = moment(startDate).isSame(new Date(), 'D');
  const isExpiringToday = moment(expiryDate).isSame(new Date(), 'D');

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
      case type === 'basic' && !isLicenseValid && isWorkspaceAdmin && size !== 'xsmall':
        return `Start your 14-day free trial!`;
      case isExpired && type === 'trial':
        return `Your trial has ended.`;
      case isExpiringToday && type === 'trial': {
        return `Your trial ends today!`;
      }
      case isLicenseValid && licenseType === 'trial' && !iscurrentDate && type === 'trial': {
        return `Your trial ends in ${daysLeft} days!`;
      }
      case isLicenseValid && licenseType === 'trial' && type === 'trial': {
        return `Your ${daysLeft}-day trial has started!`;
      }
      case type === 'enterprise' || type === 'business':
        return '';
      case type == 'tables' && !canAddUnlimited && (100 > percentage >= 90 || (total <= 10 && current === total - 1)):
        return `You're reaching your limit for number of ${type} - ${current}/${total}`;
      case type == 'tables' && !canAddUnlimited && percentage >= 100:
        return `You've reached your limit for number of ${type} - ${current}/${total}`;
      case !canAddUnlimited && percentage >= 100:
        return `You have reached your limit for number of ${type}.`;
      case !canAddUnlimited && (percentage >= 90 || (total <= 10 && current === total - 1)):
        return `You're reaching your limit for number of ${type} - ${current}/${total}`;
      case (!isLicenseValid || isExpired) && features.includes(type) && !isAvailable:
        return `You cannot access ${type}`;
      default:
        return '';
    }
  };

  const generateInfo = () => {
    switch (true) {
      case licenseType === 'basic' && !isLicenseValid && isWorkspaceAdmin:
        return `Explore advanced features while enjoying this workspace's free trial.`;
      case licenseType === 'trial' && isWorkspaceAdmin:
        return `Upgrade to a paid plan to continue accessing premium features in this workspace`;
      case licenseType === 'trial' && !isWorkspaceAdmin:
        return `Contact admin to continue using ToolJet's premium features in this workspace`;
      case daysLeft <= 14 && isWorkspaceAdmin:
        return `Renew your subscription to continue accessing ToolJet's premium features in this workspace`;
      case daysLeft <= 14 && !isWorkspaceAdmin:
        return `Contact your admin to renew your ToolJet subscription in this workspace.`;
      case (isExpired && !isWorkspaceAdmin) || licenseType === 'basic' || licenseType === 'trial':
        return `Contact admin to continue using ToolJet's premium features in this workspace`;
      case !isLicenseValid && licenseType === 'basic' && isWorkspaceAdmin:
        return `Contact your admin to upgrade ToolJet from the free plan to a paid plan`;
      case isExpired && licenseType === 'basic':
        return `Renew your subscription to continue accessing ToolJet's premium features`;
      case licenseType === 'trial':
        return `Upgrade to a paid plan to continue accessing premium features`;
      case !isLicenseValid && licenseType === 'basic':
        return `Upgrade to a paid plan to try out our premium features and build better apps faster`;
      default:
        return '';
    }
  };

  const generateButtonTextAndLink = () => {
    switch (true) {
      case showPaidFeatureBanner === true:
        return {
          text: 'Paid feature',
          onClick: () => {
            upgradeEventTrack();
            navigate(`/${workspaceId}/settings/subscription?currentTab=upgradePlan`);
          },
        };
      case licenseType === 'basic' && !isLicenseValid && isWorkspaceAdmin:
        return {
          text: 'Start free trial',
          onClick: () => {
            setIsLoading(true);
            licenseService
              .generateCloudTrial({
                email: currentUser.current_user.email,
                customerId: currentUser.current_user.id,
                organizationId: currentUser.current_organization_id,
              })
              .then(() => {
                window.location.reload();
              })
              .catch((e) => {
                setIsLoading(false);
                toast.error(e.error);
              });
          },
        };

      case (size === 'xsmall' || size === 'small') &&
        (type === 'trial' ||
          type === 'basic' ||
          type === 'enterprise' ||
          type === 'business' ||
          type === 'apps' ||
          type === 'workspaces') &&
        isEndUser:
        return {
          text: 'For more, contact admin',
          className: 'sub-heading',
          replaceText: true,
        };
      case isExpired && (type === 'basic' || type === 'trial'):
        return {
          text: 'Upgrade',
          onClick: () => {
            upgradeEventTrack();
            navigate(`/${workspaceId}/settings/subscription?currentTab=upgradePlan`);
          },
        };
      case type === 'trial':
        return {
          text: 'Upgrade',
          onClick: () => {
            upgradeEventTrack();
            navigate(`/${workspaceId}/settings/subscription?currentTab=upgradePlan`);
          },
          replaceText: false,
        };
      case type === 'enterprise' || type === 'business':
        return {
          text: 'Renew',
          onClick: () => {
            renewEventTrack();
            navigate(`/${workspaceId}/settings/subscription?currentTab=upgradePlan`);
          },
        };
      default:
        return {
          text: 'Upgrade',
          onClick: () => {
            upgradeEventTrack();
            navigate(`/${workspaceId}/settings/subscription?currentTab=upgradePlan`);
          },
        };
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  if (showPaidFeatureBanner) {
    const buttonTextAndClick = generateButtonTextAndLink();
    const { onClick: handleClick, text: buttonText } = buttonTextAndClick;
    return (
      <div className={`paid-feature-banner d-flex`}>
        {!warningText && currentUser.admin && <SolidIcon {...iconSize} fill={'None'} name="enterpriseGradient" />}
        <span
          onClick={currentUser?.admin && handleClick}
          className={`upgrade-link ${currentUser?.admin ? 'cursor-pointer' : ''}`}
          style={{ fontWeight: '500' }}
          data-cy="paid-feature-button"
        >
          {buttonText}
        </span>
      </div>
    );
  }

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
        <p className="m-0" id="support-email" data-cy="support-email">
          hello@tooljet.com
        </p>
        <SolidIcon name="copy" width="16" onClick={() => copyFunction('support-email')} />
      </div>
    </div>
  );

  const commonMessage =
    isEndUser || isWorkspaceAdmin
      ? `Contact your super admin to ${buttonText.toLowerCase()} your ToolJet subscription.`
      : ` ${
          buttonText.charAt(0).toUpperCase() + buttonText.slice(1)
        } your subscription to continue accessing ToolJet's premium features`;
  if (isLoading && type === licenseType) {
    return (
      <div style={{ ...style }} className={`license-banner d-flex ${classes}`}>
        <div className="license-loader">
          <div className="generic-loader"></div>
          <div className="tj-text-sm">Generating trial license key..</div>
        </div>
      </div>
    );
  }

  return message ? (
    <div style={{ ...style }} className={`license-banner d-flex ${classes}`}>
      {!warningText && <SolidIcon {...iconSize} fill={darkMode ? '#3F2200' : '#FFEDD4'} name="enterpriseGradient" />}
      <div className="message-wrapper">
        <div className={`heading ${warningText?.parentClassName}`}>
          {warningText && <div className={warningText?.className}>{warningText?.text}</div>}
          <div style={{ fontWeight: size === 'large' ? 500 : 400 }} data-cy="warning-text-header">
            {applyBoldFormatting(message)}{' '}
            {(size === 'small' || size === 'xsmall') && (
              <div className={`cursor-pointer ${className} ${size === 'xsmall' && 'd-inline'}`}>
                {!replaceText ? (
                  <>
                    {!replaceText && 'For more, '}
                    <span
                      onClick={handleClick}
                      className={`${currentUser?.admin && 'upgrade-link'} cursor-pointer ${className} `}
                    >
                      {buttonText}
                    </span>
                  </>
                ) : (
                  <span onClick={handleClick}>{buttonText}</span>
                )}
              </div>
            )}
          </div>
          {size === 'large' && (
            <span style={{ fontWeight: 400 }} data-cy="warning-info-text">
              {generateInfo() || commonMessage}
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
      </div>
      {size === 'large' && currentUser.admin && (
        <button onClick={handleClick} className="tj-base-btn upgrade-btn" data-cy="upgrade-link">
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
