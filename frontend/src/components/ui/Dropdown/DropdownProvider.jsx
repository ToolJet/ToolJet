import React, { createContext, useContext, useRef } from 'react';

const DropdownContext = createContext(null); // Changed from undefined to null

// This allows us to check if the context is provided without throwing an error
// It provides a way to manage dropdown instances and ensure only one is open at a time.
export const DropdownProvider = ({ children }) => {
  const openDropdownRef = useRef(null);

  const registerDropdown = (dropdownInstance) => {
    // Close the currently open dropdown if it exists
    if (openDropdownRef.current && openDropdownRef.current !== dropdownInstance) {
      openDropdownRef.current.close();
    }
    openDropdownRef.current = dropdownInstance;
  };

  const unregisterDropdown = (dropdownInstance) => {
    if (openDropdownRef.current === dropdownInstance) {
      openDropdownRef.current = null;
    }
  };

  return (
    <DropdownContext.Provider value={{ registerDropdown, unregisterDropdown }}>{children}</DropdownContext.Provider>
  );
};

export const useDropdownContext = () => {
  const context = useContext(DropdownContext);

  // Return fallback functions if no provider is found
  if (!context) {
    return {
      registerDropdown: () => {}, // No-op function
      unregisterDropdown: () => {}, // No-op function
    };
  }

  return context;
};
