import React from 'react';
import { CustomSelectColumn } from '@/AppBuilder/Widgets/NewTable/_components/DataTypes/CustomSelect';
// import { useStore } from '@/AppBuilder/Widgets/NewTable/_store';
/**
 * MultiselectFieldAdapter - KeyValuePair adapter for Multiselect
 *
 * Uses CustomSelect from Table for consistent multiselect rendering across the app.
 */
export const MultiselectField = ({
  field,
  value = [],
  onChange,
  isEditable = false,
  placeholder = 'Select...',
  darkMode = false,
  textColor,
  containerWidth,
  optionsLoadingState = false,
  defaultOptionsList = [],
  id,
  isEditing,
  setIsEditing,
}) => {
  // const getResolvedValue = useStore.getState().getResolvedValue;
  // let options = [];
  // let useDynamicOptions = getResolvedValue(field?.useDynamicOptions);
  // if (useDynamicOptions) {
  //   const dynamicOptions = getResolvedValue(field?.dynamicOptions || []);
  //   options = Array.isArray(dynamicOptions) ? dynamicOptions : [];
  // } else {
  //   options = field?.options ?? [];
  //   options =
  //     options?.map((option) => ({
  //       label: option.label,
  //       value: option.value,
  //       optionColor: option.optionColor,
  //       labelColor: option.labelColor,
  //     })) ?? [];
  // }
  return (
    <div className="h-100 d-flex align-items-center flex-column justify-content-center">
      <CustomSelectColumn
        // options={options}
        value={value}
        search={true}
        onChange={onChange}
        fuzzySearch
        placeholder={placeholder}
        disabled={!isEditable}
        className="select-search table-select-search"
        darkMode={darkMode}
        defaultOptionsList={defaultOptionsList}
        textColor={textColor}
        isMulti={true}
        containerWidth={containerWidth}
        optionsLoadingState={optionsLoadingState}
        isEditable={isEditable}
        id={id}
        column={field}
        isFocused={isEditing}
        setIsFocused={setIsEditing}
        widgetType={'key-value-pair'}
        autoAssignColors={field?.autoAssignColors}
      />
    </div>
  );
};

export default MultiselectField;
