'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DocumentList from '@/components/documents/DocumentList';
import UploadDocumentModal from '@/components/documents/UploadDocumentModal';
import Header from '@/components/ui/header';
import { Pencil } from 'lucide-react';

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [collection, setCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchCollection();
      fetchDocuments();
    }
  }, [session, params.id]);

  useEffect(() => {
    if (collection) {
      setDescriptionDraft(collection.description || '');
    }
  }, [collection]);

  const fetchCollection = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCollection(data);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleUploadDocument = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/collections/${params.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchDocuments();
        setIsUploadModalOpen(false);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleDeleteDocument = (documentId) => {
    setDocuments(documents.filter(document => document.id !== documentId));
  };

  const handleExtractTables = (documentId, tableCount) => {
    // Update the document's table count in the local state
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, tableCount: tableCount }
        : doc
    ));
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleCancelEdit = () => {
    setDescriptionDraft(collection.description || '');
    setIsEditingDescription(false);
  };

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      const response = await fetch(`/api/collections/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionDraft }),
      });
      if (response.ok) {
        const updated = await response.json();
        setCollection(updated);
        setIsEditingDescription(false);
      } else {
        // Optionally show error
      }
    } catch (error) {
      // Optionally show error
    } finally {
      setIsSavingDescription(false);
    }
  };

  if (status === 'loading' || !collection) {
    return <div>Loading...</div>;
  }

  return (
	  <div><Header />
	    <div className="container mx-auto px-4 py-8">
	      <div className="flex justify-between items-center mb-6">
	        <div>
	          <h1 className="text-2xl font-bold">{collection.name}</h1>
	          <p className="text-gray-500">
	            Created: {new Date(collection.createdAt).toLocaleDateString()}
	          </p>
	        </div>
	        <button
	          onClick={() => setIsUploadModalOpen(true)}
	          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
	        >
	          Upload Document
	        </button>
	      </div>

	      {/* Description Box */}
	      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-5 transition-all">
	        <div className="flex items-start justify-between gap-2">
	          <div className="flex-1">
	            {isEditingDescription ? (
	              <div className="space-y-3">
	                <textarea
	                  value={descriptionDraft}
	                  onChange={(e) => setDescriptionDraft(e.target.value)}
	                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
	                  rows={3}
	                  placeholder="Enter collection description..."
	                />
	                <div className="flex gap-2">
	                  <button
	                    onClick={handleSaveDescription}
	                    disabled={isSavingDescription}
	                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
	                  >
	                    {isSavingDescription ? 'Saving...' : 'Save'}
	                  </button>
	                  <button
	                    onClick={handleCancelEdit}
	                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
	                  >
	                    Cancel
	                  </button>
	                </div>
	              </div>
	            ) : (
	              <div>
	                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
	                <p className="text-gray-300 whitespace-pre-wrap">
	                  {collection.description || 'No description provided.'}
	                </p>
	              </div>
	            )}
	          </div>

	          {session?.user?.email === collection.userId && !isEditingDescription && (
	            <button
	              className="ml-2 p-2 rounded-full hover:bg-blue-900 text-blue-400 transition flex items-center justify-center border border-transparent hover:border-blue-700"
	              onClick={handleEditDescription}
	              title="Edit description"
	            >
	              <Pencil size={18} />
	            </button>
	          )}
	        </div>
	      </div>

	      <DocumentList 
	        documents={documents} 
	        onDelete={handleDeleteDocument}
	        onExtractTables={handleExtractTables}
	      />

	      <UploadDocumentModal
	        isOpen={isUploadModalOpen}
	        onClose={() => setIsUploadModalOpen(false)}
	        onUpload={handleUploadDocument}
	      />
	    </div>
	  </div>
  );
}
