'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import TableList from '@/components/tables/TableList';
import UploadTableModal from '@/components/tables/UploadTableModal';

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [collection, setCollection] = useState(null);
  const [tables, setTables] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

  if (status === 'loading' || !collection) {
    return <div>Loading...</div>;
  }

  return (
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

      <TableList tables={tables} onDelete={handleDeleteTable} />

      <UploadTableModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadTable}
      />
    </div>
  );
} 