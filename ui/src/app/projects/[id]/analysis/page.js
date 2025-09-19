'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BarChart3, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function AnalysisDashboard({ projectId }) {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisStatus = (document) => {
    if (document.statisticalAnalysis?.completed) {
      return 'completed';
    }
    if (document.qualityAssessment?.overallScore > 0) {
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
          <p className="mt-4 text-gray-600">Loading analysis dashboard...</p>
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

  const assessedDocuments = documents.filter(doc => doc.qualityAssessment?.overallScore > 0);
  const analyzedCount = assessedDocuments.filter(doc => getAnalysisStatus(doc) === 'completed').length;
  const pendingCount = assessedDocuments.filter(doc => getAnalysisStatus(doc) === 'pending').length;

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
                <h1 className="text-2xl font-bold text-gray-900">Statistical Analysis</h1>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {analyzedCount} of {assessedDocuments.length} documents analyzed
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${assessedDocuments.length > 0 ? (analyzedCount / assessedDocuments.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analysis Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Assessed Documents</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {assessedDocuments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Analyzed</span>
                  <span className="text-2xl font-bold text-green-600">
                    {analyzedCount}
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
                    {assessedDocuments.length > 0 ? Math.round((analyzedCount / assessedDocuments.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Tools */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Tools</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className="text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Meta-Analysis</h4>
                      <p className="text-sm text-gray-500">Statistical synthesis of effect sizes</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-green-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Forest Plot</h4>
                      <p className="text-sm text-gray-500">Visual representation of study effects</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className="text-purple-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Funnel Plot</h4>
                      <p className="text-sm text-gray-500">Assessment of publication bias</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Documents Ready for Analysis</h2>
              </div>
              <div className="p-6">
                {assessedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {assessedDocuments.map((document) => {
                      const status = getAnalysisStatus(document);
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
                              {status === 'completed' ? 'Analyzed' : 
                               status === 'pending' ? 'Pending' : 'Not Applicable'}
                            </span>
                            {status === 'pending' && (
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Start analysis"
                              >
                                <BarChart3 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready for analysis</h3>
                    <p className="text-gray-500 mb-4">Complete the quality assessment process first</p>
                    <Link
                      href={`/projects/${params.id}/quality`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Quality Assessment
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
