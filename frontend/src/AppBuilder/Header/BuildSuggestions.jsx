import { useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { debounce } from 'lodash';

const BuildSuggestions = (moduleId = 'canvas') => {
  const shouldBuildSuggestions = useStore((state) => state.shouldBuildSuggestions);
  const setShouldBuildSuggestions = useStore((state) => state.setShouldBuildSuggestions);
  const initAppSuggestions = useStore((state) => state.initAppSuggestions);
  const setAppHints = useStore((state) => state.setAppHints);
  const debouncedRef = useRef(null);
  const isInitialized = useRef(true);
  useEffect(() => {
    if (shouldBuildSuggestions) {
      if (debouncedRef.current) {
        debouncedRef.current();
        return;
      }
      debouncedRef.current = debounce(() => {
        debouncedRef.current = null;
        setShouldBuildSuggestions(false);
        if (isInitialized.current) {
          initAppSuggestions();
          isInitialized.current = false;
        } else {
          setAppHints();
        }
      }, 3000);
      debouncedRef.current();
    }
  }, [initAppSuggestions, moduleId, setAppHints, setShouldBuildSuggestions, shouldBuildSuggestions]);
  return null;
};

export default BuildSuggestions;
