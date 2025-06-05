import React, { useEffect, useState, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import DataSectionUI from './DataSectionUI';
import { isEqual } from 'lodash';
import { FORM_STATUS } from './constants';

const DataSectionWrapper = ({ source, JSONData, component, ...restProps }) => {
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);

  const [buttonDetails, setButtonDetails] = useState({ disabled: true, text: 'Generate form' });

  const currentStatusRef = useRef(FORM_STATUS.GENERATE_FIELDS);

  useEffect(() => {
    const existingData = getFormDataSectionData(component?.id);

    const isFormGenerated = existingData && existingData.generateFormFrom && existingData.JSONData;
    const sourceChanged = !isEqual(existingData?.generateFormFrom?.value, source?.value);
    const JSONDataChanged = !isEqual(existingData?.JSONData?.value, JSONData?.value);
    const hasJsonData = JSONData && JSONData !== '';
    const hasSource = source.value && source.value !== '';

    let newButtonDetails = {};

    // Case: Form not generated yet
    if (!isFormGenerated) {
      newButtonDetails.text = 'Generate form';
      currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;
      newButtonDetails.disabled = !(hasJsonData && hasSource);
    }
    // Case: Form is already generated
    else {
      // Source changed - need to regenerate form
      if (sourceChanged) {
        newButtonDetails.text = 'Generate form';
        currentStatusRef.current = FORM_STATUS.GENERATE_FIELDS;
        newButtonDetails.disabled = !hasJsonData;
      }
      // Source is same but JSON data changed - refresh form
      else if (JSONDataChanged) {
        newButtonDetails.text = 'Refresh form';
        currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
        newButtonDetails.disabled = !hasJsonData;
      }
      // No changes
      else {
        newButtonDetails.text = 'Refresh form';
        currentStatusRef.current = FORM_STATUS.REFRESH_FIELDS;
        newButtonDetails.disabled = true;
      }
    }

    setButtonDetails((prevDetails) => ({
      ...prevDetails,
      ...newButtonDetails,
    }));
  }, [source, JSONData, component?.id, getFormDataSectionData]);

  // You'll need to return the actual button component here instead of null
  return (
    <DataSectionUI
      component={component}
      buttonDetails={buttonDetails}
      {...restProps}
      currentStatusRef={currentStatusRef}
    />
  );
};

export default DataSectionWrapper;
