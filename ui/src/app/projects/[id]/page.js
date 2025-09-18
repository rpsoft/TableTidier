'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  FileText, 
  Upload, 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Eye,
  Edit,
  Database,
  Download,
  Search,
  TrendingUp,
  AlertTriangle,
  MessageCircle,
  Brain,
  Target
} from 'lucide-react';
import UploadDocumentModal from '@/components/projects/UploadDocumentModal';
import ExportManager from '@/components/export/ExportManager';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import QualityAssessment from '@/components/quality/QualityAssessment';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import CollaborationPanel from '@/components/collaboration/CollaborationPanel';
import OntologyManager from '@/components/ontology/OntologyManager';
import WorkflowManager from '@/components/workflow/WorkflowManager';
import AIAssistant from '@/components/ai/AIAssistant';
import InteractiveCharts from '@/components/visualization/InteractiveCharts';

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  
  // Data persistence
  const { 
    isSaving, 
    lastSaved, 
    error: saveError, 
    saveProject, 
    saveDocument, 
    saveScreening, 
    saveExtraction, 
    saveQualityAssessment 
  } = useDataPersistence(project?.id);

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchProjectData();
    }
  }, [status, params.id]);

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

  const handleDocumentUpload = (newDocument) => {
    setDocuments(prev => [newDocument, ...prev]);
    // Refresh project data to update statistics
    fetchProjectData();
  };

  const getScreeningStatus = (document) => {
    const latestScreening = document.screening?.[document.screening.length - 1];
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
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  {isSaving && (
                    <div className="flex items-center text-blue-600 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Saving...
                    </div>
                  )}
                  {lastSaved && !isSaving && (
                    <div className="text-green-600 text-sm">
                      Saved {new Date(lastSaved).toLocaleTimeString()}
                    </div>
                  )}
                  {saveError && (
                    <div className="text-red-600 text-sm">
                      Save failed: {saveError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowCollaboration(!showCollaboration)}
                className={`p-2 rounded-lg transition-colors ${
                  showCollaboration 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('workflow')}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Project Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setActiveTab('overview')}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Project Users"
              >
                <Users size={20} />
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
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'export', label: 'Export', icon: Download },
              { id: 'ontology', label: 'Ontology', icon: Target },
              { id: 'workflow', label: 'Workflow', icon: Settings },
              { id: 'ai', label: 'AI Assistant', icon: Brain },
              { id: 'charts', label: 'Visualizations', icon: BarChart3 },
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
            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Research Question</h3>
                  <p className="text-gray-600 italic">
                    {project.researchQuestion || 'No research question defined'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'text-green-600 bg-green-100' :
                    project.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {(project.criteria?.inclusion?.length > 0 || project.criteria?.exclusion?.length > 0) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Inclusion Criteria</h3>
                    <ul className="text-gray-600 space-y-1">
                      {project.criteria.inclusion.map((criterion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Exclusion Criteria</h3>
                    <ul className="text-gray-600 space-y-1">
                      {project.criteria.exclusion.map((criterion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <FileText className="text-blue-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {project.statistics?.totalDocuments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Eye className="text-yellow-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Screened</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {project.statistics?.screenedDocuments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <CheckCircle className="text-green-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Included</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {project.statistics?.includedDocuments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <Users className="text-purple-600" size={24} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {project.teamMembers?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PRISMA Flow */}
            {project.prismaData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">PRISMA Flow Diagram</h2>
                <div className="flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p>PRISMA flow diagram visualization will be implemented here</p>
                    <p className="text-sm mt-2">
                      Identified: {project.prismaData.identified} | 
                      Screened: {project.prismaData.screened} | 
                      Assessed: {project.prismaData.assessed} | 
                      Included: {project.prismaData.included}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <div className="flex gap-3">
                <Link
                  href={`/projects/${params.id}/screening`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Start Screening
                </Link>
                <Link
                  href={`/projects/${params.id}/extraction`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Database size={16} />
                  Data Extraction
                </Link>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload Document
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-6">Upload your first document to get started</p>
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tables
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => {
                        const screeningStatus = getScreeningStatus(doc);
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {doc.metadata?.title || doc.fileName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {doc.metadata?.authors?.join(', ') || 'Unknown authors'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${screeningStatus.color}`}>
                                {getScreeningIcon(screeningStatus.status)}
                                {screeningStatus.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {doc.tables?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                href={`/projects/${params.id}/documents/${doc.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <AdvancedSearch 
              documents={documents} 
              onResults={setSearchResults}
            />
            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                <div className="space-y-3">
                  {searchResults.map((doc) => (
                    <div key={doc.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <h4 className="font-medium text-gray-900">{doc.metadata?.title || doc.fileName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {doc.metadata?.authors?.join(', ') || 'Unknown authors'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Tables: {doc.tables?.length || 0}</span>
                        <span>Status: {getScreeningStatus(doc).status}</span>
                        <button 
                          onClick={() => setSelectedDocument(doc)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            project={project} 
            documents={documents} 
            users={project?.teamMembers || []} 
          />
        )}

        {activeTab === 'export' && (
          <ExportManager 
            project={project} 
            documents={documents} 
            extractedData={documents.flatMap(doc => doc.extractedData || [])} 
          />
        )}

        {activeTab === 'ontology' && (
          <OntologyManager 
            project={project} 
            documents={documents}
            onConceptMapping={(mapping) => {
              console.log('Concept mapping:', mapping);
              // In real implementation, this would save to database
            }}
          />
        )}

        {activeTab === 'workflow' && (
          <WorkflowManager 
            project={project} 
            onWorkflowUpdate={(workflow) => {
              console.log('Workflow updated:', workflow);
              // In real implementation, this would save to database
            }}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistant 
            project={project} 
            documents={documents} 
            onAIAnalysis={(analysis) => {
              console.log('AI analysis:', analysis);
              // In real implementation, this would save to database
            }}
          />
        )}

        {activeTab === 'charts' && (
          <InteractiveCharts 
            project={project} 
            documents={documents} 
            onChartUpdate={(chart) => {
              console.log('Chart updated:', chart);
              // In real implementation, this would save chart state
            }}
          />
        )}

        {activeTab === 'screening' && (
          <div className="text-center py-12">
            <Eye size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Screening Interface</h3>
            <p className="text-gray-600">Screening interface will be implemented here</p>
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

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleDocumentUpload}
        projectId={params.id}
      />

      {/* Collaboration Panel */}
      {showCollaboration && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-50">
          <CollaborationPanel 
            project={project} 
            currentUser={session?.user} 
            onUpdate={fetchProjectData}
          />
        </div>
      )}

      {/* Quality Assessment Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Quality Assessment</h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <QualityAssessment 
                document={selectedDocument} 
                onSave={async (docId, assessment) => {
                  // Save quality assessment
                  console.log('Saving quality assessment:', assessment);
                  setSelectedDocument(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
