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

  useEffect(() => {
    if (clearCount > 0 && clearFnRef.current) clearFnRef.current();
  }, [clearCount]);

  return clearCount;
};

export default FormSignalContext;
