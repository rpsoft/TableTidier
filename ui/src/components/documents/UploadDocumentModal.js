'use client';

import { useState } from 'react';

export default function UploadDocumentModal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/html') {
        setError('Please upload an HTML file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const fileContent = await file.text();
      // We don't require tables to be present in the document initially
      // Tables will be extracted later using the extract tables functionality

      onUpload(file);
    } catch (error) {
      setError('Error reading file');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 text-white p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-1">
              HTML Document
            </label>
            <input
              type="file"
              id="file"
              accept=".html"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {file && (
              <p className="text-sm text-gray-400 mt-2">
                Selected file: <span className="font-medium text-gray-200">{file.name}</span>
              </p>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-400">
              Upload an HTML document. You can extract tables from it later using the "Extract Tables" button.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-200 bg-gray-600 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 