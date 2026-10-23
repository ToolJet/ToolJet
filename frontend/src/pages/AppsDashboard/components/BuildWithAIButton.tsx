import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';

interface BuildWithAIButtonProps {
  onClick?: () => void;
  'data-cy'?: string;
}

export default function BuildWithAIButton({ onClick, 'data-cy': dataCy }: BuildWithAIButtonProps) {
  return (
    <Button variant="outline" className="tw-border-border-weak" onClick={onClick} data-cy={dataCy}>
      <SolidIcon name="tooljetai" width={16} height={16} />
      Build with AI
    </Button>
  );
}
