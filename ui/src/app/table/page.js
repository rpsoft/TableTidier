import React from 'react';
import { TableProvider } from './TableContext';
import TablePage from './TablePage'

const ParentComponent = () => {
  return (
    <TableProvider>
        <TablePage />
    </TableProvider>
  );
};

export default ParentComponent;
