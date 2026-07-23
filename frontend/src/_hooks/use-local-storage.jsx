import { useEffect, useState, useRef } from 'react';
import _ from 'lodash';

export const useLocalStorageState = (
  key,
  defaultValue,
  { serialize = JSON.stringify, deserialize = JSON.parse } = {}
) => {
  const [state, setState] = useState(() => {
    let valueInLocalStorage = window.localStorage.getItem(key);

    if (valueInLocalStorage === null) {
      // key not found
      return defaultValue;

    if (valueInLocalStorage) {
      return deserialize(valueInLocalStorage);
    }

    //if we are getting the data may be with a function call or getting for an api
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  const prevKeyRef = useRef(key);

  useEffect(() => {
    const prevKey = prevKeyRef.current;

    if (prevKey !== key) {
      window.localStorage.removeItem(prevKey);
    }
    prevKeyRef.current = key;
    window.localStorage.setItem(key, serialize(state));
  }, [key, serialize, state]);

  return [state, setState];
};
