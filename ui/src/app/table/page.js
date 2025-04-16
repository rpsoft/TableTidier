'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TableProvider } from './TableContext';
import TablePage from './TablePage';

const ParentComponent = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');

  return (
    <TableProvider>
      <TablePage initialTableId={tableId} />
    </TableProvider>
  );
};

export default ParentComponent;
