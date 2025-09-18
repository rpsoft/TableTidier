'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  Table, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Edit,
  Save
} from 'lucide-react';

export default function DocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [screeningDecision, setScreeningDecision] = useState('');
  const [screeningReason, setScreeningReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && params.id && params.documentId) {
      fetchDocument();
    }
  }, [status, params.id, params.documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${params.documentId}`);
      if (response.ok) {
        const data = await response.json();
        setDocument(data);
        
        // Set current screening decision if exists
        const latestScreening = data.screening?.[data.screening.length - 1];
        if (latestScreening) {
          setScreeningDecision(latestScreening.decision);
          setScreeningReason(latestScreening.reason || '');
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScreeningDecision = async () => {
    if (!screeningDecision) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${params.documentId}/screening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: screeningDecision,
          reason: screeningReason,
        }),
      });

      if (response.ok) {
        await fetchDocument(); // Refresh document data
        setSaving(false);
      } else {
        console.error('Error saving screening decision');
      }
    } catch (error) {
      console.error('Error saving screening decision:', error);
    } finally {
      setSaving(false);
    }
  };

  const getScreeningStatus = () => {
    const latestScreening = document?.screening?.[document.screening.length - 1];
    if (!latestScreening) return { status: 'pending', color: 'text-yellow-600 bg-yellow-100' };
    
    switch (latestScreening.decision) {
      case 'included': return { status: 'included', color: 'text-green-600 bg-green-100' };
      case 'excluded': return { status: 'excluded', color: 'text-red-600 bg-red-100' };
      default: return { status: 'pending', color: 'text-yellow-600 bg-yellow-100' };
    }
  };

  const getScreeningIcon = (status) => {
    switch (status) {
      case 'included': return <CheckCircle size={16} />;
      case 'excluded': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document not found</h1>
          <Link href={`/projects/${params.id}`} className="text-blue-600 hover:text-blue-700">
            ← Back to Project
          </Link>
        </div>
      </div>
    );
  }

  const screeningStatus = getScreeningStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${params.id}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {document.metadata?.title || document.fileName}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">
                    {document.metadata?.authors?.join(', ') || 'Unknown authors'}
                  </p>
                  {document.metadata?.year && (
                    <span className="text-gray-500">({document.metadata.year})</span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${screeningStatus.color}`}>
                    {getScreeningIcon(screeningStatus.status)}
                    {screeningStatus.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'tables', label: 'Tables', icon: Table },
              { id: 'screening', label: 'Screening', icon: Eye },
              { id: 'extraction', label: 'Data Extraction', icon: Edit },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Document Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Title</h3>
                  <p className="text-gray-600">{document.metadata?.title || 'No title available'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Authors</h3>
                  <p className="text-gray-600">
                    {document.metadata?.authors?.join(', ') || 'No authors available'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Journal</h3>
                  <p className="text-gray-600">{document.metadata?.journal || 'No journal information'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Year</h3>
                  <p className="text-gray-600">{document.metadata?.year || 'No year available'}</p>
                </div>
                {document.metadata?.doi && (
                  <div className="md:col-span-2">
                    <h3 className="font-medium text-gray-900 mb-2">DOI</h3>
                    <p className="text-gray-600">{document.metadata.doi}</p>
                  </div>
                )}
              </div>

              {document.metadata?.abstract && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Abstract</h3>
                  <p className="text-gray-600 leading-relaxed">{document.metadata.abstract}</p>
                </div>
              )}

              {document.metadata?.keywords && document.metadata.keywords.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {document.metadata.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Table className="text-blue-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tables</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {document.tables?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <FileText className="text-green-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Text Sections</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {document.text?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Edit className="text-purple-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Extracted Data</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {document.extractedData?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Tables</h2>
              <span className="text-sm text-gray-500">
                {document.tables?.length || 0} tables found
              </span>
            </div>

            {document.tables?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Table size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
                <p className="text-gray-600">This document doesn&apos;t contain any tables</p>
              </div>
            ) : (
              <div className="space-y-6">
                {document.tables.map((table, index) => (
                  <div key={table.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Table {index + 1}
                      </h3>
                      <Link
                        href={`/projects/${params.id}/documents/${params.documentId}/tables/${table.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Annotate Table
                      </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead className="bg-gray-50">
                          {table.headers?.map((headerRow, rowIndex) => (
                            <tr key={rowIndex}>
                              {headerRow.map((cell, cellIndex) => (
                                <th
                                  key={cellIndex}
                                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200"
                                >
                                  {cell}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {table.rows?.slice(0, 5).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-2 text-sm text-gray-900 border border-gray-200"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {table.rows?.length > 5 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          ... and {table.rows.length - 5} more rows
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'screening' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Screening Decision</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'included', label: 'Include', icon: CheckCircle, color: 'text-green-600' },
                      { value: 'excluded', label: 'Exclude', icon: XCircle, color: 'text-red-600' },
                      { value: 'pending', label: 'Pending Review', icon: Clock, color: 'text-yellow-600' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="screeningDecision"
                          value={option.value}
                          checked={screeningDecision === option.value}
                          onChange={(e) => setScreeningDecision(e.target.value)}
                          className="mr-3"
                        />
                        <option.icon size={20} className={`mr-2 ${option.color}`} />
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={screeningReason}
                    onChange={(e) => setScreeningReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reason for this decision..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleScreeningDecision}
                    disabled={!screeningDecision || saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Decision
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Screening History */}
            {document.screening && document.screening.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Screening History</h3>
                <div className="space-y-3">
                  {document.screening.map((screening, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getScreeningIcon(screening.decision)}
                        <span className="font-medium text-gray-900">{screening.decision}</span>
                        {screening.reason && (
                          <span className="text-gray-600">- {screening.reason}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(screening.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extraction' && (
          <div className="text-center py-12">
            <Edit size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Data Extraction</h3>
            <p className="text-gray-600">Data extraction interface will be implemented here</p>
          </div>
        )}
      </div>
    </div>
  );
}
