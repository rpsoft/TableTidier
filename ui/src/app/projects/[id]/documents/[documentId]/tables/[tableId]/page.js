'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Download } from 'lucide-react';
import CustomTableEditor from '@/app/table/components/CustomTableEditor';
import { TableProvider } from '@/app/table/TableContext';

export default function TableAnnotationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState(null);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && params.id && params.documentId && params.tableId) {
      fetchDocument();
    }
  }, [status, params.id, params.documentId, params.tableId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${params.documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
        
        // Find the specific table
        const foundTable = data.tables?.find(t => t.id === params.tableId);
        if (foundTable) {
          setTable(foundTable);
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTable = async (htmlContent) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${params.documentId}/tables/${params.tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          updatedAt: new Date(),
        }),
      });

      if (response.ok) {
        // Update local state
        setTable(prev => ({
          ...prev,
          htmlContent,
          updatedAt: new Date(),
        }));
        
        // Show success message (you could add a toast here)
        console.log('Table saved successfully');
      } else {
        console.error('Error saving table');
      }
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading table...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!document || !table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Table not found</h1>
          <Link 
            href={`/projects/${params.id}/documents/${params.documentId}`} 
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${params.id}/documents/${params.documentId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Table Annotation
                </h1>
                <p className="text-gray-600 text-sm">
                  {document.metadata?.title || document.fileName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Trigger save in the table editor
                  const saveButton = document.querySelector('[data-save-button]');
                  if (saveButton) {
                    saveButton.click();
                  }
                }}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Editor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Table Structure</h2>
            <p className="text-gray-600 text-sm">
              Annotate this table by selecting cells and assigning them to data categories. 
              Use the tools below to merge cells, add rows/columns, and organize your data.
            </p>
          </div>
          
          <TableProvider>
            <CustomTableEditor
              initialHtml={table.htmlContent}
              onSave={handleSaveTable}
              showSaveButton={false} // We'll handle saving with our custom button
              showToolbar={true}
              allowEditing={true}
            />
          </TableProvider>
        </div>

        {/* Table Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-2">Table Dimensions</h3>
            <p className="text-sm text-gray-600">
              {table.headers?.length || 0} header rows × {table.rows?.length || 0} data rows
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-2">Annotations</h3>
            <p className="text-sm text-gray-600">
              {Object.keys(table.annotations?.columns || {}).length} columns annotated
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-2">Last Updated</h3>
            <p className="text-sm text-gray-600">
              {table.updatedAt ? new Date(table.updatedAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Annotation Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select cells by clicking and dragging to highlight them</li>
            <li>• Right-click on selected cells to access annotation options</li>
            <li>• Use the toolbar to merge cells, add rows/columns, or split merged cells</li>
            <li>• Assign data categories to help organize your systematic review data</li>
            <li>• Save your changes regularly to avoid losing work</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
