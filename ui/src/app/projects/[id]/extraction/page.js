'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DataExtractionInterface from '@/components/extraction/DataExtractionInterface';
import { ArrowLeft, FileText, Database } from 'lucide-react';

export default function DataExtractionPage() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProjectData();
    }
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectResponse, documentsResponse] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/documents`)
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
        // Auto-select first document if available
        if (documentsData.length > 0) {
          setSelectedDocument(documentsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExtractedData = async (documentId, extractedData) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save extracted data');
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, extractedData }
          : doc
      ));

      if (selectedDocument?.id === documentId) {
        setSelectedDocument(prev => ({ ...prev, extractedData }));
      }
    } catch (error) {
      console.error('Error saving extracted data:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading extraction data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project.name} - Data Extraction
                </h1>
                <p className="text-sm text-gray-600">
                  Extract systematic review variables from documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Selector */}
      {documents.length > 1 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Database size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Select Document:</span>
              <select
                value={selectedDocument?.id || ''}
                onChange={(e) => {
                  const doc = documents.find(d => d.id === e.target.value);
                  setSelectedDocument(doc);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.metadata?.title || doc.fileName || 'Untitled Document'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {selectedDocument ? (
          <DataExtractionInterface
            document={selectedDocument}
            project={project}
            onSave={handleSaveExtractedData}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Available</h3>
              <p className="text-gray-600">Upload documents to begin data extraction</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
