'use client';

import { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  BarChart3, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  Filter
} from 'lucide-react';

export default function ExportManager({ project, documents, extractedData }) {
  const [exportType, setExportType] = useState('screening');
  const [exportFormat, setExportFormat] = useState('csv');
  const [filters, setFilters] = useState({
    includeScreened: true,
    includeExcluded: true,
    includePending: true,
    dateRange: null,
    reviewers: []
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const exportTypes = [
    {
      id: 'screening',
      name: 'Screening Results',
      description: 'Document screening decisions and reasons',
      icon: <Eye size={20} />,
      formats: ['csv', 'xlsx', 'json']
    },
    {
      id: 'extraction',
      name: 'Extracted Data',
      description: 'Systematic review variables and extracted data',
      icon: <Table size={20} />,
      formats: ['csv', 'xlsx', 'json']
    },
    {
      id: 'prisma',
      name: 'PRISMA Flow Diagram',
      description: 'PRISMA flow diagram data for visualization',
      icon: <BarChart3 size={20} />,
      formats: ['json', 'csv']
    },
    {
      id: 'bibliography',
      name: 'Bibliography',
      description: 'Formatted bibliography for included studies',
      icon: <FileText size={20} />,
      formats: ['bib', 'ris', 'endnote', 'txt']
    },
    {
      id: 'full-report',
      name: 'Full Report',
      description: 'Complete systematic review report',
      icon: <FileText size={20} />,
      formats: ['pdf', 'docx', 'html']
    }
  ];

  const getFilteredDocuments = () => {
    return documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      const decision = latestScreening?.decision || 'pending';
      
      if (decision === 'included' && !filters.includeScreened) return false;
      if (decision === 'excluded' && !filters.includeExcluded) return false;
      if (decision === 'pending' && !filters.includePending) return false;
      
      return true;
    });
  };


  const generateScreeningExport = () => {
    const filteredDocs = getFilteredDocuments();
    const data = filteredDocs.map(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return {
        'Document ID': doc.id,
        'Title': doc.metadata?.title || 'Untitled',
        'Authors': doc.metadata?.authors?.join('; ') || '',
        'Journal': doc.metadata?.journal || '',
        'Year': doc.metadata?.year || '',
        'DOI': doc.metadata?.doi || '',
        'Screening Decision': latestScreening?.decision || 'pending',
        'Screening Reason': latestScreening?.reason || '',
        'Screened By': latestScreening?.userId || '',
        'Screening Date': latestScreening?.timestamp ? new Date(latestScreening.timestamp).toLocaleDateString() : '',
        'Abstract': doc.metadata?.abstract || '',
        'Keywords': doc.metadata?.keywords?.join('; ') || ''
      };
    });
    return data;
  };

  const generateExtractionExport = () => {
    const data = [];
    documents.forEach(doc => {
      if (doc.extractedData && doc.extractedData.length > 0) {
        doc.extractedData.forEach(item => {
          data.push({
            'Document ID': doc.id,
            'Document Title': doc.metadata?.title || 'Untitled',
            'Variable': item.variable,
            'Value': item.value,
            'Source Table': item.source?.tableId || '',
            'Source Cell': `[${item.source?.cell?.join(',')}]`,
            'UMLS ID': item.ontologyMatch?.umlsId || '',
            'Concept Name': item.ontologyMatch?.conceptName || '',
            'Extracted By': item.extractedBy || '',
            'Extraction Date': item.extractedAt ? new Date(item.extractedAt).toLocaleDateString() : ''
          });
        });
      }
    });
    return data;
  };

  const generatePRISMAExport = () => {
    const totalRecords = documents.length;
    const duplicatesRemoved = 0; // This would be calculated based on duplicate detection
    const recordsScreened = documents.filter(doc => doc.screening?.length > 0).length;
    const recordsExcluded = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'excluded';
    }).length;
    const fullTextAssessed = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'included';
    }).length;
    const studiesIncluded = fullTextAssessed; // Assuming all included studies are in final review

    return {
      'Identification': {
        'Records identified through database searching': totalRecords,
        'Additional records identified through other sources': 0,
        'Records after duplicates removed': totalRecords - duplicatesRemoved,
        'Records screened': recordsScreened,
        'Records excluded': recordsExcluded
      },
      'Screening': {
        'Reports sought for retrieval': fullTextAssessed,
        'Reports not retrieved': 0,
        'Reports assessed for eligibility': fullTextAssessed,
        'Reports excluded': 0,
        'Studies included in qualitative synthesis': studiesIncluded,
        'Studies included in quantitative synthesis': studiesIncluded
      }
    };
  };

  const generateBibliography = (format) => {
    const includedDocs = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'included';
    });

    if (format === 'bib') {
      return includedDocs.map((doc, index) => {
        const authors = doc.metadata?.authors?.join(' and ') || 'Unknown';
        const year = doc.metadata?.year || 'Unknown';
        const title = doc.metadata?.title || 'Untitled';
        const journal = doc.metadata?.journal || 'Unknown Journal';
        const doi = doc.metadata?.doi || '';
        
        return `@article{study${index + 1},
  author = {${authors}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}},
  doi = {${doi}}
}`;
      }).join('\n\n');
    }

    if (format === 'ris') {
      return includedDocs.map(doc => {
        const lines = [
          'TY  - JOUR',
          `TI  - ${doc.metadata?.title || 'Untitled'}`,
          `AU  - ${doc.metadata?.authors?.join('\nAU  - ') || 'Unknown'}`,
          `T2  - ${doc.metadata?.journal || 'Unknown Journal'}`,
          `PY  - ${doc.metadata?.year || 'Unknown'}`,
          `DO  - ${doc.metadata?.doi || ''}`,
          'ER  - '
        ];
        return lines.join('\n');
      }).join('\n\n');
    }

    return includedDocs.map(doc => 
      `${doc.metadata?.authors?.join(', ') || 'Unknown'} (${doc.metadata?.year || 'Unknown'}). ${doc.metadata?.title || 'Untitled'}. ${doc.metadata?.journal || 'Unknown Journal'}.`
    ).join('\n');
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: 'info', message: 'Preparing export...' });

    try {
      // Map export types to API data types
      const dataTypeMap = {
        'screening': 'screening_results',
        'extraction': 'extracted_data',
        'prisma': 'screening_results', // PRISMA uses screening data
        'bibliography': 'documents'
      };

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          format: exportFormat,
          dataType: dataTypeMap[exportType] || 'documents',
          filters: {
            includeScreened: filters.includeScreened,
            includeExcluded: filters.includeExcluded,
            includePending: filters.includePending,
            yearRange: filters.dateRange ? {
              start: filters.dateRange.start,
              end: filters.dateRange.end
            } : null,
            reviewers: filters.reviewers
          }
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const exportData = await response.json();
      
      if (exportData.success) {
        // Create and download the file
        const blob = new Blob([exportData.data.content], { type: exportData.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportData.data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setExportStatus({ type: 'success', message: `Export completed: ${exportData.data.fileName}` });
      } else {
        throw new Error(exportData.error || 'Export failed');
      }
    } catch (error) {
      setExportStatus({ 
        type: 'error', 
        message: `Export failed: ${error.message}` 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertCircle size={16} className="text-yellow-500" />;
      case 'info': return <Loader size={16} className="text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export & Reports</h1>
        <p className="text-gray-600">Export your systematic review data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Export Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setExportType(type.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    exportType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {type.icon}
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>
            <div className="flex flex-wrap gap-3">
              {exportTypes.find(t => t.id === exportType)?.formats.map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    exportFormat === format
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter size={20} />
              Filters
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include Documents
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.includeScreened}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeScreened: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Included Studies</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.includeExcluded}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeExcluded: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Excluded Studies</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.includePending}
                      onChange={(e) => setFilters(prev => ({ ...prev, includePending: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Pending Review</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Preview & Status */}
        <div className="space-y-6">
          {/* Export Status */}
          {exportStatus && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Status</h2>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                exportStatus.type === 'success' ? 'bg-green-50 text-green-700' :
                exportStatus.type === 'error' ? 'bg-red-50 text-red-700' :
                exportStatus.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {getStatusIcon(exportStatus.type)}
                <span className="text-sm">{exportStatus.message}</span>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Export Type: <span className="font-medium">{exportTypes.find(t => t.id === exportType)?.name}</span></div>
              <div>Format: <span className="font-medium">{exportFormat.toUpperCase()}</span></div>
              <div>Documents: <span className="font-medium">{getFilteredDocuments().length}</span></div>
              {exportType === 'extraction' && (
                <div>Variables: <span className="font-medium">
                  {documents.reduce((acc, doc) => acc + (doc.extractedData?.length || 0), 0)}
                </span></div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Documents</span>
                <span className="font-medium">{documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Screened</span>
                <span className="font-medium">
                  {documents.filter(doc => doc.screening?.length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Included</span>
                <span className="font-medium text-green-600">
                  {documents.filter(doc => {
                    const latestScreening = doc.screening?.[doc.screening.length - 1];
                    return latestScreening?.decision === 'included';
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Excluded</span>
                <span className="font-medium text-red-600">
                  {documents.filter(doc => {
                    const latestScreening = doc.screening?.[doc.screening.length - 1];
                    return latestScreening?.decision === 'excluded';
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
