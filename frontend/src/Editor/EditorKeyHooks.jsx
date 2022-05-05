import React, { useState, useRef, useLayoutEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

export const EditorKeyHooks = ({ moveComponents }) => {
  useHotkeys('up, down, left, right', (e) => {
    e.preventDefault();
    moveComponents(e.code);
  });

  return <></>;
};
