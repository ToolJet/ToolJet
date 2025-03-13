import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { useNavigate } from 'react-router-dom';

const RenderWorkflow = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, []);

  return <></>;
};

export default withEditionSpecificComponent(RenderWorkflow, 'RenderWorkflow');
