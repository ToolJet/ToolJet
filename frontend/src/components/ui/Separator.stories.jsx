import React from 'react';
import { Separator } from './separator';

export default {
  title: 'Components/Separator',
  component: Separator,
};

export const Default = () => (
  <div>
    <p>Some text.</p>
    <Separator />
    <p>Some more text.</p>
  </div>
);

export const Vertical = () => (
  <div style={{ display: 'flex', height: '100px' }}>
    <p>Some text.</p>
    <Separator orientation="vertical" />
    <p>Some more text.</p>
  </div>
);
