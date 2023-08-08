import React, { useState, useEffect } from 'react';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import config from 'config';

export const TextArea = function TextArea({ height, properties, styles, setExposedVariable, registerAction, dataCy }) {
  const [value, setValue] = useState(properties.value);
  useEffect(() => {
    setValue(properties.value);
    setExposedVariable('value', properties.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.value]);

  registerAction(
    'setText',
    async function (text) {
      setValue(text);
      setExposedVariable('value', text);
    },
    [setValue]
  );
  registerAction(
    'clear',
    async function () {
      setValue('');
      setExposedVariable('value', '');
    },
    [setValue]
  );
  return (
    <>
      {config.UI_LIB === 'tooljet' && (
        <textarea
          disabled={styles.disabledState}
          onChange={(e) => {
            setValue(e.target.value);
            setExposedVariable('value', e.target.value);
          }}
          type="text"
          className="form-control textarea"
          placeholder={properties.placeholder}
          style={{
            height,
            resize: 'none',
            display: styles.visibility ? '' : 'none',
            borderRadius: `${styles.borderRadius}px`,
            boxShadow: styles.boxShadow,
          }}
          value={value}
          data-cy={dataCy}
        ></textarea>
      )}
      {config.UI_LIB === 'mui' && (
        <TextareaAutosize
          disabled={styles.disabledState}
          placeholder={properties.placeholder}
          className="form-control textarea"
          value={value}
          minRows={2}
          onChange={(e) => {
            setValue(e.target.value);
            setExposedVariable('value', e.target.value);
          }}
          style={{
            height,
            display: styles.visibility ? '' : 'none',
            borderRadius: `${styles.borderRadius}px`,
            boxShadow: styles.boxShadow,
          }}
        />
      )}
    </>
  );
};
