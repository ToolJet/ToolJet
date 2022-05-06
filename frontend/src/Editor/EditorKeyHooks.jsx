import React from 'react';
import useKeyHooks from '@/_hooks/useKeyHooks';

export const EditorKeyHooks = ({ moveComponents }) => {
  useKeyHooks(['up, down, left, right'], moveComponents);

  return <></>;
};
