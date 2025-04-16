'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

export default function TablePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [table, setTable] = useState(null);

  const formatDate = (date) => {
    try {
      if (!date) return 'No date';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchTable();
    }
  }, [session, params.id, params.tableId]);

  const fetchTable = async () => {
    try {
      const response = await fetch(`/api/collections/${params.id}/tables/${params.tableId}`);
      if (response.ok) {
        const data = await response.json();
        setTable(data);
      }
    } catch (error) {
      console.error('Error fetching table:', error);
    }
  };

  if (status === 'loading' || !table) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-black">{table.fileName}</h1>
        <p className="text-gray-500">
          Created: {formatDate(table.createdAt)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4">
          <div 
            className="overflow-x-auto text-black"
            dangerouslySetInnerHTML={{ __html: table.htmlContent }} 
          />
        </div>
      </div>
    </div>
  );
} 