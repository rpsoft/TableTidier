'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, Clock, BookOpen, Edit3 } from 'lucide-react';

export default function SynthesisDashboard({ projectId }) {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      const [projectResponse, documentsResponse] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/documents`)
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSynthesisStatus = (document) => {
    if (document.synthesis?.completed) {
      return 'completed';
    }
    if (document.statisticalAnalysis?.completed) {
      return 'pending';
    }
    return 'not-applicable';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading synthesis dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const analyzedDocuments = documents.filter(doc => doc.statisticalAnalysis?.completed);
  const synthesizedCount = analyzedDocuments.filter(doc => getSynthesisStatus(doc) === 'completed').length;
  const pendingCount = analyzedDocuments.filter(doc => getSynthesisStatus(doc) === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/projects/${params.id}`}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Synthesis & Analysis</h1>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {synthesizedCount} of {analyzedDocuments.length} documents synthesized
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analyzedDocuments.length > 0 ? (synthesizedCount / analyzedDocuments.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Synthesis Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Synthesis Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Analyzed Documents</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analyzedDocuments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Synthesized</span>
                  <span className="text-2xl font-bold text-green-600">
                    {synthesizedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {pendingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {analyzedDocuments.length > 0 ? Math.round((synthesizedCount / analyzedDocuments.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Synthesis Tools */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Synthesis Tools</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Narrative Synthesis</h4>
                      <p className="text-sm text-gray-500">Qualitative synthesis of findings</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-green-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Report Generator</h4>
                      <p className="text-sm text-gray-500">Automated report generation</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Edit3 size={20} className="text-purple-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Manuscript Draft</h4>
                      <p className="text-sm text-gray-500">Generate manuscript sections</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Documents Ready for Synthesis</h2>
              </div>
              <div className="p-6">
                {analyzedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {analyzedDocuments.map((document) => {
                      const status = getSynthesisStatus(document);
                      return (
                        <div key={document.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-gray-400" />
                            <div>
                              <h3 className="font-medium text-gray-900">{document.fileName}</h3>
                              <p className="text-sm text-gray-500">
                                {document.metadata?.title || 'No title available'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status === 'completed' ? 'Synthesized' : 
                               status === 'pending' ? 'Pending' : 'Not Applicable'}
                            </span>
                            {status === 'pending' && (
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Start synthesis"
                              >
                                <BookOpen size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready for synthesis</h3>
                    <p className="text-gray-500 mb-4">Complete the statistical analysis process first</p>
                    <Link
                      href={`/projects/${params.id}/analysis`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Statistical Analysis
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
