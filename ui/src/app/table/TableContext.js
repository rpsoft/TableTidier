'use client';
import React, { createContext, useContext, useState } from 'react';

// Create Context
const TableContext = createContext();

// Custom Hook to Use Context
export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

// Context Provider Component
export const TableProvider = ({ children }) => {
  // Consolidate state definitions
  const [state, setState] = useState({
    cellContextOpen: false,
    cellContextPoints: { x: 0, y: 0 },
    tableClickPosition: [0,0],
    selectedCells: {},
    selectedTable: null,
    tables: [],
    tableNodes: [],
    annotations: [],
    extractedData: [],
    groupContextOpen: false,
    groupContextData: null,
    groupContextIndex: null,
    colourSelectGroup: false,
  });

  // Simplify setters dynamically
  const setValue = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <TableContext.Provider value={{ state, setValue }}>
      {children}
    </TableContext.Provider>
  );
};
