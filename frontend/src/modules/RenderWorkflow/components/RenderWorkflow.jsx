import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EERenderWorkflow from '@ee/modules/RenderWorkflow/components/RenderWorkflow';

const RenderWorkflow = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, []);

  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? RenderWorkflow : EERenderWorkflow;
