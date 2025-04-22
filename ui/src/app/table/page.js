'use client';
import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TableProvider } from './TableContext';
import TablePage from './TablePage';

// Component that uses useSearchParams
const TableContent = () => {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');

  return (
    <TableProvider>
      <TablePage initialTableId={tableId} />
    </TableProvider>
  );
};

// Parent component that wraps TableContent in Suspense
const ParentComponent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TableContent />
    </Suspense>
  );
};

export default ParentComponent;
