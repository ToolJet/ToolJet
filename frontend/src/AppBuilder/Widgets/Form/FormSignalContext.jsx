import { createContext, useContext, useEffect, useRef } from 'react';

const FormSignalContext = createContext({ submitAttemptCount: 0, clearCount: 0 });

export const useShowValidationOnFormSubmit = (setVisible) => {
  const { submitAttemptCount } = useContext(FormSignalContext);
  useEffect(() => {
    if (submitAttemptCount > 0) setVisible(true);
  }, [submitAttemptCount, setVisible]);
};

export const useFormClear = (clearFn) => {
  const { clearCount } = useContext(FormSignalContext);
  const clearFnRef = useRef(clearFn);

  clearFnRef.current = clearFn;

  useEffect(() => {
    if (clearCount > 0) clearFnRef.current();
  }, [clearCount]);
};

export default FormSignalContext;
