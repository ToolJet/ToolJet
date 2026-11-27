import { createContext } from 'react';

// In the full-page data source layout this holds the header element that hosts the form's actions. Forms with their
// own save/connect buttons (OAuth, SharePoint) portal them there instead of rendering a footer; null in the modal.
export const DataSourcePageActionsContext = createContext(null);
