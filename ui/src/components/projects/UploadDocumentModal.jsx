'use client';

import { useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

export default function UploadDocumentModal({ isOpen, onClose, onUpload, projectId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.filter(file => 
        file.name.endsWith('.html') || file.name.endsWith('.htm')
      );
      
      if (validFiles.length !== selectedFiles.length) {
        setError('Some files are not HTML files and will be skipped');
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
        file.name.endsWith('.html') || file.name.endsWith('.htm')
      );
      
      if (validFiles.length !== droppedFiles.length) {
        setError('Some files are not HTML files and will be skipped');
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

      // Call onUpload for each uploaded document
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

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setError('');
      setUploadProgress({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Documents {files.length > 0 && `(${files.length})`}
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select HTML Files
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
                        accept=".html,.htm"
                        multiple
                        className="sr-only"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">HTML files only (multiple files supported)</p>
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

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
