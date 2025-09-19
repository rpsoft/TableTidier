'use client';

import { useState } from 'react';
import { Upload, X, FileText, Search, Download, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';

export default function DocumentAcquisitionModal({ isOpen, onClose, onUpload, projectId }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  
  // API Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('pubmed');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

  const dataSources = [
    {
      id: 'pubmed',
      name: 'PubMed/MEDLINE',
      description: 'Free access to biomedical literature',
      icon: '🔬',
      requiresAuth: false,
      maxResults: 100,
      enabled: true
    },
    {
      id: 'clinicaltrials',
      name: 'ClinicalTrials.gov',
      description: 'Clinical trial registry database',
      icon: '🏥',
      requiresAuth: false,
      maxResults: 50,
      enabled: true
    },
    {
      id: 'cochrane',
      name: 'Cochrane Library',
      description: 'Systematic reviews and meta-analyses',
      icon: '📚',
      requiresAuth: true,
      maxResults: 25,
      enabled: false // Will be enabled when API key is configured
    },
    {
      id: 'embase',
      name: 'Embase',
      description: 'Comprehensive biomedical database',
      icon: '🔍',
      requiresAuth: true,
      maxResults: 50,
      enabled: false // Will be enabled when API key is configured
    }
  ];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.filter(file => 
        file.name.endsWith('.html') || 
        file.name.endsWith('.htm') || 
        file.name.endsWith('.pdf')
      );
      
      if (validFiles.length !== selectedFiles.length) {
        setError('Some files are not supported and will be skipped');
      } else {
        setError('');
      }
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const validFiles = droppedFiles.filter(file => 
        file.name.endsWith('.html') || 
        file.name.endsWith('.htm') || 
        file.name.endsWith('.pdf')
      );
      
      if (validFiles.length !== droppedFiles.length) {
        setError('Some files are not supported and will be skipped');
      } else {
        setError('');
      }
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress({});

    try {
      const uploadedDocuments = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/projects/${projectId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const document = await response.json();
          uploadedDocuments.push(document);
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        } else {
          const errorData = await response.json();
          throw new Error(`Failed to upload ${file.name}: ${errorData.error || 'Upload failed'}`);
        }
      }

      uploadedDocuments.forEach(document => onUpload(document));
      
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/documents/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          source: selectedSource,
          maxResults: dataSources.find(s => s.id === selectedSource)?.maxResults || 25
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleResultSelect = (resultId) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleDownloadSelected = async () => {
    if (selectedResults.size === 0) {
      setError('Please select at least one document to download');
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const selectedResultsArray = Array.from(selectedResults);
      const response = await fetch(`/api/projects/${projectId}/documents/acquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: selectedSource,
          documentIds: selectedResultsArray,
          searchQuery: searchQuery
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Handle successful acquisitions
          if (result.acquiredDocuments && result.acquiredDocuments.length > 0) {
            result.acquiredDocuments.forEach(document => onUpload(document));
          }
          
          // Show warnings if some documents failed
          if (result.warnings) {
            setError(result.warnings);
            // Don't close the modal if there were warnings, let user see them
          } else {
            setSelectedResults(new Set());
            setSearchResults([]);
            onClose();
          }
          
          // Show success message
          if (result.totalAcquired > 0) {
            console.log(`Successfully acquired ${result.totalAcquired} out of ${result.totalRequested} documents`);
          }
        } else {
          throw new Error(result.error || 'Download failed');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError(error.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    if (!uploading && !downloading) {
      setFiles([]);
      setError('');
      setUploadProgress({});
      setSearchQuery('');
      setSearchResults([]);
      setSelectedResults(new Set());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Document Acquisition
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading || downloading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="inline w-4 h-4 mr-2" />
              Upload Files
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className="inline w-4 h-4 mr-2" />
              Search & Download
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Documents
                </label>
                <div 
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".html,.htm,.pdf"
                          multiple
                          className="sr-only"
                          onChange={handleFileSelect}
                          disabled={uploading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">HTML and PDF files supported</p>
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Selected Files:</h3>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">{file.name}</span>
                            <span className="ml-2 text-xs text-gray-500 flex-shrink-0">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          {!uploading && (
                            <button
                              onClick={() => removeFile(index)}
                              className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {uploading && uploadProgress[index] !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[index]}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {uploadProgress[index]}% uploaded
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Source
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {dataSources.map(source => (
                      <option 
                        key={source.id} 
                        value={source.id}
                        disabled={!source.enabled}
                      >
                        {source.icon} {source.name}
                        {!source.enabled && ' (Not Configured)'}
                        {source.requiresAuth && source.enabled && ' (Auth Required)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Query
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter search terms..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {searching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Search size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {dataSources.find(s => s.id === selectedSource)?.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {dataSources.find(s => s.id === selectedSource)?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {dataSources.find(s => s.id === selectedSource)?.description}
                    </p>
                    {!dataSources.find(s => s.id === selectedSource)?.enabled && (
                      <p className="text-xs text-red-600 mt-1">
                        ❌ This data source is not configured - configure API keys in settings
                      </p>
                    )}
                    {dataSources.find(s => s.id === selectedSource)?.requiresAuth && dataSources.find(s => s.id === selectedSource)?.enabled && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Authentication required - API key configured
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Search Results ({searchResults.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {selectedResults.size} selected
                      </span>
                      <button
                        onClick={handleDownloadSelected}
                        disabled={selectedResults.size === 0 || downloading}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {downloading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Download size={16} />
                        )}
                        Download Selected
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={result.id || index}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedResults.has(result.id || index)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleResultSelect(result.id || index)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {selectedResults.has(result.id || index) ? (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {result.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {result.abstract || result.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {result.authors && (
                                <span>Authors: {result.authors.slice(0, 3).join(', ')}</span>
                              )}
                              {result.journal && <span>Journal: {result.journal}</span>}
                              {result.year && <span>Year: {result.year}</span>}
                              {result.doi && (
                                <span className="flex items-center gap-1">
                                  DOI: {result.doi}
                                  <ExternalLink size={12} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-4">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={uploading || downloading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            {activeTab === 'upload' && (
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading {files.length} file{files.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload {files.length > 0 ? `${files.length} ` : ''}Document{files.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
