'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText, Table, Download } from 'lucide-react';
import TableList from '@/components/tables/TableList';
import Header from '@/components/ui/header';

export default function DocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState(null);
  const [tables, setTables] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchDocument();
      fetchTables();
    }
  }, [session, params.id, params.documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}/documents/${params.documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}/documents/${params.documentId}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleExtractTables = async () => {
    if (isExtracting) return;

    setIsExtracting(true);
    try {
      const response = await fetch(`/api/collections/${params.id}/documents/${params.documentId}/extract-tables`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully extracted ${result.extractedCount} tables from the document.`);
        fetchTables();
        fetchDocument(); // Refresh document to get updated table count
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to extract tables');
      }
    } catch (error) {
      console.error('Error extracting tables:', error);
      alert('Failed to extract tables');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteTable = (tableId) => {
    setTables(tables.filter(table => table.id !== tableId));
    // Update document table count
    if (document) {
      setDocument(prev => ({ ...prev, tableCount: Math.max(0, prev.tableCount - 1) }));
    }
  };

  if (status === 'loading' || !document) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/collections/${params.id}`)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Collection
          </button>
        </div>

        {/* Document Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText size={24} />
              {document.name}
            </h1>
            <p className="text-gray-500 mt-1">
              Uploaded: {new Date(document.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-500">
              Last updated: {new Date(document.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleExtractTables}
            disabled={isExtracting}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={16} />
            {isExtracting ? 'Extracting...' : 'Extract Tables'}
          </button>
        </div>

        {/* Document Content Preview */}
        <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-white mb-3">Document Content Preview</h3>
          {/* <div 
            className="text-sm text-gray-300 overflow-auto max-h-96 border border-gray-600 rounded p-4 bg-gray-900"
            dangerouslySetInnerHTML={{ __html: document.htmlContent }}
          /> */}
          <iframe
            srcDoc={document.htmlContent}
            className="w-full h-96 border border-gray-600 rounded bg-white"
            title="Document Preview"
            sandbox="allow-same-origin"
          />
        </div>

        {/* Tables Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Table size={20} />
              Tables ({document.tableCount || 0})
            </h2>
          </div>

          {tables.length === 0 ? (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <Table size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-400 mb-2">No tables extracted yet</p>
              <p className="text-sm text-gray-500">
                Click "Extract Tables" to find and extract tables from this document
              </p>
            </div>
          ) : (
            <TableList 
              tables={tables} 
              onDelete={handleDeleteTable}
              collectionId={params.id}
              documentId={params.documentId}
            />
          )}
        </div>
      </div>
    </div>
  );
} 