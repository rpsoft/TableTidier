'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function QualityDashboard({ projectId }) {
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

  const getQualityStatus = (document) => {
    if (document.qualityAssessment?.overallScore > 0) {
      return 'completed';
    }
    if (document.extractedData?.length > 0) {
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

  const getQualityScore = (document) => {
    if (document.qualityAssessment?.overallScore) {
      const score = document.qualityAssessment.overallScore;
      if (score >= 80) return { score, level: 'High', color: 'text-green-600 bg-green-100' };
      if (score >= 60) return { score, level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
      return { score, level: 'Low', color: 'text-red-600 bg-red-100' };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quality assessment dashboard...</p>
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

  const extractedDocuments = documents.filter(doc => doc.extractedData?.length > 0);
  const assessedCount = extractedDocuments.filter(doc => getQualityStatus(doc) === 'completed').length;
  const pendingCount = extractedDocuments.filter(doc => getQualityStatus(doc) === 'pending').length;
  const averageScore = extractedDocuments
    .filter(doc => doc.qualityAssessment?.overallScore)
    .reduce((sum, doc) => sum + doc.qualityAssessment.overallScore, 0) / assessedCount || 0;

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
                <h1 className="text-2xl font-bold text-gray-900">Quality Assessment</h1>
                <p className="text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {assessedCount} of {extractedDocuments.length} documents assessed
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${extractedDocuments.length > 0 ? (assessedCount / extractedDocuments.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quality Statistics */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Progress</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Extracted Documents</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {extractedDocuments.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Assessed</span>
                  <span className="text-2xl font-bold text-green-600">
                    {assessedCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {pendingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Score</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.round(averageScore)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Guidelines */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Criteria</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Randomization and allocation concealment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Blinding of participants and personnel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Incomplete outcome data handling</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Selective outcome reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Other sources of bias</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Document List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Documents Ready for Assessment</h2>
              </div>
              <div className="p-6">
                {extractedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {extractedDocuments.map((document) => {
                      const status = getQualityStatus(document);
                      const qualityScore = getQualityScore(document);
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
                            {qualityScore && (
                              <span className={`px-2 py-1 text-xs rounded-full ${qualityScore.color}`}>
                                {qualityScore.score}% ({qualityScore.level})
                              </span>
                            )}
                            {getStatusIcon(status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                              {status === 'completed' ? 'Assessed' : 
                               status === 'pending' ? 'Pending' : 'Not Applicable'}
                            </span>
                            {status === 'pending' && (
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Start assessment"
                              >
                                <Shield size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents ready for assessment</h3>
                    <p className="text-gray-500 mb-4">Complete the data extraction process first</p>
                    <Link
                      href={`/projects/${params.id}/extraction`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Extraction
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
