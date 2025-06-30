'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FileText, Table, Download, Trash2 } from 'lucide-react';
import { Tooltip } from 'antd';

export default function DocumentList({ documents, onDelete, onExtractTables }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [extractingTables, setExtractingTables] = useState({});

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No documents in this collection yet. Upload one to get started!</p>
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

  const handleDelete = async (documentId, collectionId) => {
    if (isDeleting) return;
    
    if (!window.confirm('Are you sure you want to delete this document? This will also delete all associated tables.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(documentId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExtractTables = async (documentId, collectionId) => {
    if (extractingTables[documentId]) return;

    setExtractingTables(prev => ({ ...prev, [documentId]: true }));
    
    try {
      const response = await fetch(`/api/collections/${collectionId}/documents/${documentId}/extract-tables`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully extracted ${result.extractedCount} tables from the document.`);
        onExtractTables(documentId, result.extractedCount);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to extract tables');
      }
    } catch (error) {
      console.error('Error extracting tables:', error);
      alert('Failed to extract tables');
    } finally {
      setExtractingTables(prev => ({ ...prev, [documentId]: false }));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed">
        <thead className="bg-gray-800">
          <tr>
            <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Document Name</th>
            <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Upload Date</th>
            <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tables</th>
            <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Preview</th>
            <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 break-words">
                <Tooltip title={document.name}>
                  <Link
                    href={`/collections/${document.collectionId}/documents/${document.id}`}
                    className="text-white hover:text-blue-400 transition-colors flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {document.name.length > 50 ? document.name.substring(0, 50) + "..." : document.name}
                  </Link>
                </Tooltip>
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {formatDate(document.createdAt)}
              </td>
              
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                <div className="flex items-center gap-2">
                  <Table size={16} />
                  <span>{document.tableCount || 0}</span>
                </div>
              </td>
              
              <td className="px-8 py-4 break-words">
                <div 
                  className="text-sm text-gray-300 overflow-hidden max-h-20"
                  dangerouslySetInnerHTML={{ __html: document.htmlContent.substring(0, 200) + "..." }}
                />
              </td>
              
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end items-center gap-3">
                  <button
                    onClick={() => handleExtractTables(document.id, document.collectionId)}
                    disabled={extractingTables[document.id]}
                    className="text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 flex items-center gap-1"
                    title="Extract tables from document"
                  >
                    <Download size={16} />
                    {extractingTables[document.id] ? 'Extracting...' : 'Extract Tables'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(document.id, document.collectionId)}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 