import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';
import { Button } from '../../Button/Button';

export default {
  title: 'UI/Rocket/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
};

export const Default = () => (
  <Collapsible>
    <CollapsibleTrigger>
      <Button>Toggle</Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
        <p>This content is collapsible.</p>
      </div>
    </CollapsibleContent>
  </Collapsible>
);
