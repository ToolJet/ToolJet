import { useState, useEffect } from 'react';
import { useCurrentStateStore } from '../../../_stores/currentStateStore';
import { shallow } from 'zustand/shallow';
import { debuggerActions } from '../../../_helpers/appUtils';
import { flow } from 'lodash';
import moment from 'moment';

const useDebugger = ({ currentPageId, isDebuggerOpen }) => {
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorHistory, setErrorHistory] = useState({ appLevel: [], pageLevel: [] });
  const [unReadErrorCount, setUnReadErrorCount] = useState({ read: 0, unread: 0 });
  const [allLog, setAllLog] = useState([]);

  const { errors, succededQuery } = useCurrentStateStore(
    (state) => ({
      errors: state.errors,
      queries: state.queries,
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
    const newError = flow([
      Object.entries,
      // eslint-disable-next-line no-unused-vars
      (arr) => arr.filter(([key, value]) => value.data?.status),
      Object.fromEntries,
    ])(errors);
    const newErrorLogs = debuggerActions.generateErrorLogs(newError);
    const newPageLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'page_level');
    const newAppLevelErrorLogs = newErrorLogs.filter((error) => error.strace === 'app_level');
    if (newErrorLogs) {
      setErrorLogs((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));
        return [...newAppLevelErrorLogs, ...newPageLevelErrorLogs, ...copy];
      });

      setAllLog((prevLog) => [...newErrorLogs, ...prevLog]);

      setErrorHistory((prevErrors) => {
        const copy = JSON.parse(JSON.stringify(prevErrors));
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
  }, [JSON.stringify({ errors })]);

  useEffect(() => {
    const newErrorLogs = debuggerActions.generateQuerySuccessLogs(succededQuery);
    if (newErrorLogs) {
      setAllLog((prevLogs) => {
        const temp = [...newErrorLogs, ...prevLogs];
        const sortedDatesDesc = temp.sort((a, b) => moment(b.timestamp).diff(moment(a.timestamp)));
        return sortedDatesDesc;
      });
    }
    debuggerActions.flushAllLog();
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

  return {
    errorLogs,
    clearErrorLogs,
    unReadErrorCount,
    allLog,
  };
};

export default useDebugger;
