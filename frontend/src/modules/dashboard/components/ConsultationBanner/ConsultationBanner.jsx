import React from 'react';
import EEConsultationBanner from '@ee/modules/Dashboard/components/ConsultationBanner';

const ConsultationBanner = (props) => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? ConsultationBanner : EEConsultationBanner;
