'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  Users,
  BarChart3
} from 'lucide-react';

export default function ScreeningDashboard({ projectId, documents = [], onDocumentSelect }) {
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('uploadedAt');

  useEffect(() => {
    if (documents.length === 0) {
      fetchDocuments();
    }
  }, [projectId, documents.length]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, statusFilter, sortBy]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.metadata?.authors?.some(author => 
          author.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        doc.metadata?.journal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const latestScreening = doc.screening?.[doc.screening.length - 1];
        if (statusFilter === 'pending') return !latestScreening;
        if (statusFilter === 'included') return latestScreening?.decision === 'included';
        if (statusFilter === 'excluded') return latestScreening?.decision === 'excluded';
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
        case 'authors':
          return (a.metadata?.authors?.[0] || '').localeCompare(b.metadata?.authors?.[0] || '');
        case 'year':
          return (b.metadata?.year || 0) - (a.metadata?.year || 0);
        case 'status':
          const aStatus = a.screening?.[a.screening.length - 1]?.decision || 'pending';
          const bStatus = b.screening?.[b.screening.length - 1]?.decision || 'pending';
          return aStatus.localeCompare(bStatus);
        case 'uploadedAt':
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        default:
          return 0;
      }
    });

    setFilteredDocuments(filtered);
  };

  const getScreeningStatus = (document) => {
    const latestScreening = document.screening?.[document.screening.length - 1];
    if (!latestScreening) return { status: 'pending', color: 'text-yellow-600 bg-yellow-100' };
    
    switch (latestScreening.decision) {
      case 'included':
        return { status: 'included', color: 'text-green-600 bg-green-100' };
      case 'excluded':
        return { status: 'excluded', color: 'text-red-600 bg-red-100' };
      default:
        return { status: 'pending', color: 'text-yellow-600 bg-yellow-100' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'included': return <CheckCircle size={16} />;
      case 'excluded': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatistics = () => {
    const total = documents.length;
    const pending = documents.filter(doc => !doc.screening?.length).length;
    const included = documents.filter(doc => 
      doc.screening?.[doc.screening.length - 1]?.decision === 'included'
    ).length;
    const excluded = documents.filter(doc => 
      doc.screening?.[doc.screening.length - 1]?.decision === 'excluded'
    ).length;

    return { total, pending, included, excluded };
  };

  const stats = getStatistics();

  const handleExportResults = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          format: 'csv',
          dataType: 'screening_results',
          filters: {
            includeScreened: true,
            includeExcluded: true,
            includePending: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create and download the file
          const blob = new Blob([data.data.content], { type: data.data.mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.data.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  const handleViewStatistics = () => {
    // Create a modal or navigate to statistics view
    const statsModal = document.createElement('div');
    statsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    statsModal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Screening Statistics</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Documents:</span>
            <span class="font-semibold">${stats.total}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Pending:</span>
            <span class="font-semibold text-yellow-600">${stats.pending}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Included:</span>
            <span class="font-semibold text-green-600">${stats.included}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Excluded:</span>
            <span class="font-semibold text-red-600">${stats.excluded}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Completion Rate:</span>
            <span class="font-semibold">${stats.total > 0 ? Math.round(((stats.included + stats.excluded) / stats.total) * 100) : 0}%</span>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(statsModal);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Screening Dashboard</h1>
        <p className="text-gray-600">Review and screen documents for inclusion in your systematic review</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="text-blue-600" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="text-yellow-600" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="text-green-600" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Included</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.included}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircle className="text-red-600" size={24} />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Excluded</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.excluded}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search documents by title, authors, or journal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="included">Included</option>
              <option value="excluded">Excluded</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="uploadedAt">Sort by Upload Date</option>
              <option value="title">Sort by Title</option>
              <option value="authors">Sort by Authors</option>
              <option value="year">Sort by Year</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload documents to begin screening'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => {
              const screeningStatus = getScreeningStatus(document);
              const latestScreening = document.screening?.[document.screening.length - 1];
              
              return (
                <div
                  key={document.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onDocumentSelect(document)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <FileText size={20} className="text-gray-400 mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {document.metadata?.title || 'Untitled Document'}
                          </h3>
                          <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                            <span>{document.metadata?.authors?.join(', ') || 'Unknown Authors'}</span>
                            <span>•</span>
                            <span>{document.metadata?.journal || 'Unknown Journal'}</span>
                            <span>•</span>
                            <span>{document.metadata?.year || 'Unknown Year'}</span>
                          </div>
                          {document.metadata?.abstract && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {document.metadata.abstract}
                            </p>
                          )}
                          {latestScreening?.reason && (
                            <p className="mt-2 text-sm text-gray-500 italic">
                              Reason: {latestScreening.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${screeningStatus.color}`}>
                        {getStatusIcon(screeningStatus.status)}
                        {screeningStatus.status}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentSelect(document);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} documents
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportResults}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={16} />
            Export Results
          </button>
          <button 
            onClick={handleViewStatistics}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <BarChart3 size={16} />
            View Statistics
          </button>
        </div>
      </div>
    </div>
  );
}
