// import React from 'react';
// import useStore from '@/AppBuilder/_stores/store';
// import { shallow } from 'zustand/shallow';
// import HighLightSearch from '@/AppBuilder/Widgets/NewTable/_components/HighLightSearch';
// import useTextColor from '../DataTypes/_hooks/useTextColor';
// import { NumberRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/NumberRenderer';

// export const NumberColumn = ({
//   id,
//   isEditable,
//   handleCellValueChange,
//   textColor,
//   horizontalAlignment,
//   cellValue,
//   column,
//   row,
//   searchText,
//   containerWidth,
//   darkMode,
// }) => {
//   const validateWidget = useStore((state) => state.validateWidget, shallow);
//   const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
//   const cellTextColor = useTextColor(id, textColor);

//   const allowedDecimalPlaces = getResolvedValue(column?.decimalPlaces) ?? null;

//   const validationData = validateWidget({
//     validationObject: {
//       minValue: {
//         value: column?.minValue,
//       },
//       maxValue: {
//         value: column?.maxValue,
//       },
//       regex: {
//         value: column?.regex,
//       },
//       customRule: {
//         value: column?.customRule,
//       },
//     },
//     widgetValue: cellValue,
//     customResolveObjects: { cellValue },
//   });

//   const { isValid, validationError } = validationData;

//   const handleChange = (newValue) => {
//     handleCellValueChange(row.index, column.key || column.name, newValue, row.original);
//   };

//   return (
//     <NumberRenderer
//       value={cellValue}
//       isEditable={isEditable}
//       onChange={handleChange}
//       textColor={cellTextColor}
//       horizontalAlignment={horizontalAlignment}
//       containerWidth={containerWidth}
//       darkMode={darkMode}
//       decimalPlaces={allowedDecimalPlaces}
//       isValid={isValid}
//       validationError={validationError}
//       searchText={searchText}
//       SearchHighlightComponent={HighLightSearch}
//       className="table-column-type-input-element"
//     />
//   );
// };
