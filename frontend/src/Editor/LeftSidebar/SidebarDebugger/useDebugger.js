import { useState, useEffect, useCallback } from 'react';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { debuggerActions } from '@/_helpers/appUtils';
import moment from 'moment';
import useDebuggerStore from '@/_stores/debuggerStore';
import { reservedKeywordReplacer } from '@/_lib/reserved-keyword-replacer';

const useDebugger = ({ currentPageId, isDebuggerOpen }) => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorHistory, setErrorHistory] = useState({ appLevel: [], pageLevel: [] });
  const [unReadErrorCount, setUnReadErrorCount] = useState({ read: 0, unread: 0 });
  const [allLog, setAllLog] = useState([]);
  // const [selectedError, setSelectedError] = useState(null); // New state for selected error
  const { errors, succededQuery } = useCurrentStateStore(
    (state) => ({
      errors: state.errors,
      succededQuery: state.succededQuery,
    }),
    shallow
  );

  const clearErrorLogs = () => {
    setUnReadErrorCount({ read: 0, unread: 0 });
    setErrorLogs([]);
    setAllLog([]);
    setErrorHistory({ appLevel: [], pageLevel: [] });
  };

  useEffect(() => {
    if (currentPageId) {
      const olderPageErrorFromHistory = errorHistory.pageLevel[currentPageId] ?? [];
      const olderAppErrorFromHistory = errorHistory.appLevel ?? [];
      setErrorLogs(() => [...olderPageErrorFromHistory, ...olderAppErrorFromHistory]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  useEffect(() => {
    const newError = Object.entries(errors).reduce((acc, [key, value]) => {
      // Include errors with data.status OR of type 'event'
      if (value.data?.status || value.type === 'event') {
        acc[key] = value;
      }
      return acc;
    }, {});
    const newErrorLogs = debuggerActions.generateErrorLogs(newError);
    const newPageLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'page_level');
    const newAppLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'app_level');
    if (newErrorLogs) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors, reservedKeywordReplacer));
        return [...newAppLevelErrorLogs, ...newPageLevelErrorLogs, ...copy];
      });

      setAllLog((prevLog) => [...newErrorLogs, ...prevLog]);

      setErrorHistory((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors, reservedKeywordReplacer));
        return {
          appLevel: [...newAppLevelErrorLogs, ...copy.appLevel],
          pageLevel: {
            [currentPageId]: [...newPageLevelErrorLogs, ...(copy.pageLevel[currentPageId] ?? [])],
          },
        };
      });
    }
    debuggerActions.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ errors }, reservedKeywordReplacer)]);

  useEffect(() => {
    const successQueryLogs = debuggerActions.generateQuerySuccessLogs(succededQuery);
    if (successQueryLogs?.length) {
      setAllLog((prevLogs) => {
        const temp = [...successQueryLogs, ...prevLogs];
        const sortedDatesDesc = temp.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
        return sortedDatesDesc;
      });
      debuggerActions.flushAllLog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ succededQuery })]);

  useEffect(() => {
    if (isDebuggerOpen) {
      // eslint-disable-next-line no-unused-vars
      setUnReadErrorCount((prev) => ({ read: errorLogs.length, unread: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebuggerOpen]);

  useEffect(() => {
    const unReadErrors = errorLogs.length - unReadErrorCount.read;
    setUnReadErrorCount((prev) => {
      return { ...prev, unread: unReadErrors };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLogs.length]);
  // const handleErrorClick = useCallback((selectedError) => {
  //   console.log('here---', selectedError);
  //   setSelectedError(selectedError);
  // }, []);

  const setSelectedError = useDebuggerStore((state) => state.setSelectedError);

  const handleErrorClick = useCallback(
    (error) => {
      console.log('Setting error:', error);
      setSelectedError(error);
    },
    [setSelectedError]
  );
  return {
    errorLogs,
    clearErrorLogs,
    unReadErrorCount,
    allLog,
    handleErrorClick,
    // selectedError,
  };
};

export default useDebugger;
