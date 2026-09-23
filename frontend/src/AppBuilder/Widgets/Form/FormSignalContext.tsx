import { createContext, useContext, useEffect, useRef } from 'react';

interface FormSignalContextValue {
  submitAttemptCount: number;
  clearCount: number;
}

const FormSignalContext = createContext<FormSignalContextValue>({ submitAttemptCount: 0, clearCount: 0 });

export const useShowValidationOnFormSubmit = (setVisible: (visible: boolean) => void): void => {
  const { submitAttemptCount } = useContext(FormSignalContext);
  useEffect(() => {
    setVisible(submitAttemptCount > 0);
  }, [submitAttemptCount, setVisible]);
};

export const useFormClear = (clearFn?: () => void): number => {
  const { clearCount } = useContext(FormSignalContext);
  const clearFnRef = useRef(clearFn);
  clearFnRef.current = clearFn;
  // Snapshot clearCount at mount so components added after a clearForm call
  // don't immediately fire their clear logic.
  const prevClearCount = useRef(clearCount);

  useEffect(() => {
    if (clearCount > prevClearCount.current && clearFnRef.current) {
      clearFnRef.current();
    }

    prevClearCount.current = clearCount; // must always run, not only inside the if
  }, [clearCount]);

  return clearCount;
};

export default FormSignalContext;
