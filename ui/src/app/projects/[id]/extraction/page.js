'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database, FileText, CheckCircle, Clock, Edit3, X } from 'lucide-react';

export default function ExtractionDashboard({ projectId }) {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showExtractionModal, setShowExtractionModal] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExtractionStatus = (document) => {
    if (document.extractedData?.length > 0) {
      return 'completed';
    }
    if (document.screening?.length > 0) {
      const latestScreening = document.screening[document.screening.length - 1];
      return latestScreening.decision === 'included' ? 'pending' : 'not-applicable';
    }
    return 'not-applicable';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading extraction dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const includedDocuments = documents.filter(doc => {
    if (doc.screening?.length > 0) {
      const latestScreening = doc.screening[doc.screening.length - 1];
      return latestScreening.decision === 'included';
    }
    return false;
  });

  const extractedCount = includedDocuments.filter(doc => getExtractionStatus(doc) === 'completed').length;
  const pendingCount = includedDocuments.filter(doc => getExtractionStatus(doc) === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${params.id}`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Extraction</h1>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {extractedCount} of {includedDocuments.length} documents extracted
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${includedDocuments.length > 0 ? (extractedCount / includedDocuments.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Extraction Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extraction Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Included Documents</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {includedDocuments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Extracted</span>
                  <span className="text-2xl font-bold text-green-600">
                    {extractedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {pendingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {includedDocuments.length > 0 ? Math.round((extractedCount / includedDocuments.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Extraction Guidelines */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extraction Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Extract data from included documents only</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Focus on study characteristics and outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ensure consistency across extractions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use predefined extraction templates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Documents Ready for Extraction</h2>
              </div>
              <div className="p-6">
                {includedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {includedDocuments.map((document) => {
                      const status = getExtractionStatus(document);
                      return (
                        <div key={document.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-gray-400" />
                            <div>
                              <h3 className="font-medium text-gray-900">{document.fileName}</h3>
                              <p className="text-sm text-gray-500">
                                {document.metadata?.title || 'No title available'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status === 'completed' ? 'Extracted' : 
                               status === 'pending' ? 'Pending' : 'Not Applicable'}
                            </span>
                            {status === 'pending' && (
                              <button
                                onClick={() => {
                                  setSelectedDocument(document);
                                  setShowExtractionModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Start extraction"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready for extraction</h3>
                    <p className="text-gray-500 mb-4">Complete the screening process first to include documents</p>
                    <Link
                      href={`/projects/${params.id}/screening`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Screening
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extraction Modal */}
      {showExtractionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data Extraction</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedDocument.fileName}</p>
              </div>
              <button
                onClick={() => {
                  setShowExtractionModal(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Document Preview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Document Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedDocument.content || 'No content available' }} />
                    </div>
                  </div>
                </div>

                {/* Extraction Form */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Extract Data</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Study Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter study title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Authors
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter authors (comma-separated)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publication Year
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter publication year"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Study Design
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select study design</option>
                        <option value="randomized-controlled-trial">Randomized Controlled Trial</option>
                        <option value="cohort-study">Cohort Study</option>
                        <option value="case-control">Case-Control Study</option>
                        <option value="cross-sectional">Cross-Sectional Study</option>
                        <option value="systematic-review">Systematic Review</option>
                        <option value="meta-analysis">Meta-Analysis</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sample Size
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter sample size"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Findings
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter key findings"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowExtractionModal(false);
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save extraction data
                  setShowExtractionModal(false);
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Extraction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}