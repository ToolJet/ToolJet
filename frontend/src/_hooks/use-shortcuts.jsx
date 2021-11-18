/* eslint-disable react-hooks/exhaustive-deps */

// https://keycode.info/ this cheat sheet gives info about key presses

import { useEffect, useCallback } from 'react';

const useShortcuts = (keys, callback, deps) => {
  const ignoreTags = ['input', 'select', 'textarea'];
  const ignoreEventsCondition = (event) => {
    const { target } = event;

    if (target && target.tagName) {
      const tagName = target.tagName.toLowerCase();

      return ignoreTags.includes(tagName) || target.isContentEditable;
    } else {
      return false;
    }
  };
  const setsEqual = (setA, setB) => setA.size === setB.size && !Array.from(setA).some((v) => !setB.has(v));
  const memoizedCallback = useCallback(callback, deps || []);
  const targetKeys = new Set(keys.map((key) => key.toLowerCase()));
  const pressedKeys = new Set();
  function onKeyPressed(event) {
    if (ignoreEventsCondition(event)) return;
    pressedKeys.add(event.key.toLowerCase());
    if (setsEqual(pressedKeys, targetKeys)) {
      memoizedCallback();
    }
  }
  function onKeyUp(event) {
    pressedKeys.delete(event.key.toLowerCase());
  }
  function onWindowBlur() {
    pressedKeys.clear();
  }
  useEffect(() => {
    window.addEventListener('keydown', onKeyPressed);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyPressed);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [memoizedCallback]);
};

export default useShortcuts;
