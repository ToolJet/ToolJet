import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const AuditLogsPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, []);
  return <></>;
};

export default withEditionSpecificComponent(AuditLogsPage, 'AuditLogs');
