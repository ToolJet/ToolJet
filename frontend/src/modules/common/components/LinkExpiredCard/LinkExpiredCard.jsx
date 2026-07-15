import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSubpath } from '@/_helpers/routes';
import './resources/styles/link-expired-card.styles.scss';

const BrokenLinkIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="12" fill="#FFF0EE" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M45.5037 18.4969C41.2863 14.2797 34.4488 14.2797 30.2316 18.4969L27.8506 20.8779C26.9208 21.8077 26.9208 23.3153 27.8506 24.2451C28.7804 25.1749 30.288 25.1749 31.2178 24.2451L33.5988 21.8641C35.9564 19.5065 39.7789 19.5065 42.1363 21.8641C44.4939 24.2217 44.4939 28.0442 42.1363 30.4018L39.7553 32.7827C38.8256 33.7126 38.8256 35.2201 39.7553 36.1499C40.6853 37.0798 42.1927 37.0798 43.1227 36.1499L45.5037 33.769C49.7209 29.5517 49.7209 22.7142 45.5037 18.4969ZM37.2551 26.7457C38.1849 27.6755 38.1849 29.1831 37.2551 30.1129L30.1122 37.2558C29.1823 38.1856 27.6748 38.1856 26.745 37.2558C25.8152 36.326 25.8152 34.8185 26.745 33.8886L33.8879 26.7457C34.8177 25.8159 36.3253 25.8159 37.2551 26.7457ZM24.2444 27.8516C25.1742 28.7814 25.1742 30.289 24.2444 31.2188L21.8634 33.5998C19.5058 35.9574 19.5058 39.7799 21.8634 42.1375C24.221 44.4951 28.0434 44.4951 30.401 42.1375L32.782 39.7565C33.7118 38.8266 35.2194 38.8266 36.1492 39.7565C37.079 40.6863 37.079 42.1939 36.1492 43.1237L33.7682 45.5047C29.551 49.7218 22.7134 49.7218 18.4962 45.5047C14.2789 41.2873 14.2789 34.4499 18.4962 30.2326L20.8772 27.8516C21.807 26.9218 23.3145 26.9218 24.2444 27.8516Z"
      fill="#D72D39"
    />
  </svg>
);

const VARIANT_CONFIG = {
  reset: {
    titleKey: 'linkExpiredCard.resetTitle',
    titleDefault: 'Reset link expired',
    descriptionKey: 'linkExpiredCard.resetDescription',
    descriptionDefault: 'This link has expired. Generate a new one to reset your password.',
    ctaKey: 'linkExpiredCard.resetCta',
    ctaDefault: 'Back to login',
    ctaPath: '/login',
    ctaState: { from: '/reset-password' },
    dataCy: 'reset-link-expired',
  },
  verification: {
    titleKey: 'linkExpiredCard.verificationTitle',
    titleDefault: 'Verification link expired',
    descriptionKey: 'linkExpiredCard.verificationDescription',
    descriptionDefault: 'This email verification link has expired. Generate a new one to confirm your email address.',
    ctaKey: 'linkExpiredCard.verificationCta',
    ctaDefault: 'Back to sign up',
    ctaPath: '/signup',
    dataCy: 'verification-link-expired',
  },
  invite: {
    titleKey: 'linkExpiredCard.inviteTitle',
    titleDefault: 'Invite link expired',
    descriptionKey: 'linkExpiredCard.inviteDescription',
    descriptionDefault: 'This invite link has expired. Contact your workspace admin to get a new one.',
    signInPath: '/login',
    dataCy: 'invite-link-expired',
  },
  invalid: {
    titleKey: 'linkExpiredCard.invalidTitle',
    titleDefault: 'Invalid verification link',
    descriptionKey: 'linkExpiredCard.invalidDescription',
    descriptionDefault: 'The link is invalid.',
    dataCy: 'invalid-link',
  },
};

const LinkExpiredCard = ({ variant = 'reset' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.reset;

  const handleCtaClick = () => {
    const subpath = getSubpath() ? getSubpath() : '';
    navigate(`${subpath}${config.ctaPath}`, config.ctaState ? { state: config.ctaState } : undefined);
  };

  return (
    <div className="link-expired-page">
      <div className="link-expired-card-wrapper" data-cy={config.dataCy}>
        <div className="link-expired-card-icon">
          <BrokenLinkIcon />
        </div>
        <h2 className="link-expired-card-title" data-cy="link-expired-title">
          {t(config.titleKey, config.titleDefault)}
        </h2>
        <p className="link-expired-card-description" data-cy="link-expired-description">
          {t(config.descriptionKey, config.descriptionDefault)}
        </p>
        {config.ctaDefault && (
          <button className="link-expired-card-cta" onClick={handleCtaClick} data-cy="link-expired-cta">
            <span>{t(config.ctaKey, config.ctaDefault)}</span>
          </button>
        )}
        {config.signInPath && (
          <p className="link-expired-card-signin" data-cy="link-expired-signin-prompt">
            {t('linkExpiredCard.alreadyHaveAccount', 'Already have an account?')}{' '}
            <span
              className="link-expired-card-signin-link"
              onClick={() => navigate(`${getSubpath() ? getSubpath() : ''}${config.signInPath}`)}
              data-cy="link-expired-signin"
            >
              {t('linkExpiredCard.signIn', 'Sign in')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default LinkExpiredCard;
