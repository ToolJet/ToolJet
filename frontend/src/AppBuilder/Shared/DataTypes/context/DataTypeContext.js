import { createContext, useContext } from 'react';

/**
 * DataTypeContext provides widget-specific configuration to shared renderers.
 * This allows renderers to remain pure while adapting to different widget contexts
 * (Table, KeyValuePair, etc.)
 */
export const DataTypeContext = createContext({
  widgetType: null, // 'table' | 'keyValuePair' | etc.
  widgetId: null, // Unique ID of the widget instance
  getStyles: () => ({}), // Widget-specific style getter
  validate: () => ({ isValid: true, validationError: null }), // Widget-specific validation
  SearchComponent: null, // Optional search highlight component
  darkMode: false,
});

export const useDataTypeContext = () => useContext(DataTypeContext);

export const DataTypeProvider = DataTypeContext.Provider;

export default DataTypeContext;
