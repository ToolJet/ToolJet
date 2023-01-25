import React from 'react';
import { useTranslation } from 'react-i18next';

function TemplateCard() {
  const { t } = useTranslation();
  return (
    <div className="template-card-wrapper">
      <div className="template-icon-wrapper"></div>
      <div className="template-card-details">
        <p className="template-card-title">{t('homePage.templateCard.leadGeneration', 'Lead generation')}</p>
        <div className="template-action-wrapper">
          <p>{t('homePage.templateCard.use', 'Use')}</p>
          <p>{t('homePage.templateCard.preview', 'Preview')}</p>
        </div>
      </div>
    </div>
  );
}

export default TemplateCard;
