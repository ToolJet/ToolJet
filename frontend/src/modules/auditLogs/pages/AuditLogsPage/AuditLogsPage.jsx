import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EEAuditLogsPage from '@ee/modules/AuditLogs/components/AuditLogsPage';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, []);
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AuditLogsPage : EEAuditLogsPage;
