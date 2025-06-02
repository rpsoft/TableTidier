'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import TableList from '@/components/tables/TableList';
import UploadTableModal from '@/components/tables/UploadTableModal';
import Header from '@/components/ui/header';
import { Pencil } from 'lucide-react';

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [collection, setCollection] = useState(null);
  const [tables, setTables] = useState([]);
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
      fetchTables();
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

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleUploadTable = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/collections/${params.id}/tables`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fetchTables();
        setIsUploadModalOpen(false);
      }
    } catch (error) {
      console.error('Error uploading table:', error);
    }
  };

  const handleDeleteTable = (tableId) => {
    setTables(tables.filter(table => table.id !== tableId));
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
	          Upload Table
	        </button>
	      </div>

	      {/* Description Box */}
	      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-5 transition-all">
	        <div className="flex items-start justify-between gap-2">
	          <div className="w-full">
	            {isEditingDescription ? (
	              <>
	                <textarea
	                  className="w-full border border-gray-600 rounded-md p-2 text-gray-100 bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all font-medium min-h-[60px] placeholder-gray-400"
	                  rows={3}
	                  value={descriptionDraft}
	                  onChange={e => setDescriptionDraft(e.target.value)}
	                  disabled={isSavingDescription}
	                  placeholder="Add a description for this collection..."
	                />
	                <div className="mt-2 flex gap-2">
	                  <button
	                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50 font-semibold shadow"
	                    onClick={handleSaveDescription}
	                    disabled={isSavingDescription}
	                  >
	                    {isSavingDescription ? 'Saving...' : 'Save'}
	                  </button>
	                  <button
	                    className="bg-gray-700 text-gray-200 px-4 py-1.5 rounded-md hover:bg-gray-600 transition font-semibold shadow"
	                    onClick={handleCancelEdit}
	                    disabled={isSavingDescription}
	                  >
	                    Cancel
	                  </button>
	                </div>
	              </>
	            ) : (
	              <>
	                <div className="text-gray-100 min-h-[1.5em] whitespace-pre-line font-medium text-base">{collection.description || <span className="italic text-gray-400">No description yet.</span>}</div>
	              </>
	            )}
	          </div>
	          {/* Only allow editing if user is owner */}
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

	      <TableList tables={tables} onDelete={handleDeleteTable} />

	      <UploadTableModal
	        isOpen={isUploadModalOpen}
	        onClose={() => setIsUploadModalOpen(false)}
	        onUpload={handleUploadTable}
	      />
	    </div>
	  </div>
  );
}
