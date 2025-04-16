'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TableList({ tables, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (tables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No tables in this collection yet. Upload one to get started!</p>
      </div>
    );
  }

  const formatDate = (date) => {
    try {
      if (!date) return 'No date';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleDelete = async (tableId, collectionId) => {
    if (isDeleting) return;
    
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(tableId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Table Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Upload Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Preview</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {tables.map((table) => (
            <tr key={table.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/table?tableId=${table.id}`}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {table.fileName}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {formatDate(table.createdAt)}
              </td>
              <td className="px-6 py-4">
                <div 
                  className="text-sm text-gray-300 overflow-hidden max-h-20"
                  dangerouslySetInnerHTML={{ __html: table.htmlContent }}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => handleDelete(table.id, table.collectionId)}
                  disabled={isDeleting}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 