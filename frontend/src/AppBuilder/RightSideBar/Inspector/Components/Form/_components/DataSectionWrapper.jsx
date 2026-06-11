import React, { useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DataSectionUI } from './index';
import { isEqual } from 'lodash';
import { FORM_STATUS } from '../constants';

const DataSectionWrapper = ({
  source,
  JSONData,
  component,
  performColumnMapping,
  currentStatusRef,
  savedSourceValue,
  ...restProps
}) => {
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);

  useEffect(() => {
    const existingData = getFormDataSectionData(component?.id);

    const isFormGenerated = existingData && existingData.generateFormFrom && existingData.JSONData;
    const sourceChanged = !isEqual(savedSourceValue, source?.value);
    const JSONDataChanged = !isEqual(existingData?.JSONData?.value, JSONData?.value);

    // Case: Form not generated yet
    if (!isFormGenerated) {
      currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;
    }
    // Case: Form is already generated
    else {
      // Source changed - need to regenerate form
      if (sourceChanged) {
        currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;
      }
      // Source is same but JSON data changed - refresh form
      else if (JSONDataChanged) {
        currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
      }
      // No changes
      else {
        currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
      }
    }
  }, [source, JSONData, component?.id, getFormDataSectionData, currentStatusRef, savedSourceValue]);

  // You'll need to return the actual button component here instead of null
  return (
    <DataSectionUI
      component={component}
      {...restProps}
      currentStatusRef={currentStatusRef}
      performColumnMapping={performColumnMapping}
      source={source}
      JSONData={JSONData}
      savedSourceValue={savedSourceValue}
    />
  );
};

export default DataSectionWrapper;
