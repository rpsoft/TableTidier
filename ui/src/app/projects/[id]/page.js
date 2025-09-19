'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useDataPersistence } from '@/hooks/useDataPersistence';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowDown,
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
  Target,
  X
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
  const [activeTool, setActiveTool] = useState('search');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showProjectUsers, setShowProjectUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  
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

  // Workflow step navigation functions
  const advanceWorkflowStep = async (stepIndex) => {
    if (!project?.workflow?.steps || stepIndex >= project.workflow.steps.length) return;
    
    const updatedSteps = [...project.workflow.steps];
    const currentStep = updatedSteps[stepIndex];
    
    // Mark current step as completed and advance to next
    updatedSteps[stepIndex] = {
      ...currentStep,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    
    // Mark next step as in-progress if it exists
    if (stepIndex + 1 < updatedSteps.length) {
      updatedSteps[stepIndex + 1] = {
        ...updatedSteps[stepIndex + 1],
        status: 'in-progress'
      };
    }
    
    const nextStepName = stepIndex + 1 < updatedSteps.length 
      ? updatedSteps[stepIndex + 1].name.toLowerCase().replace(/\s+/g, '-')
      : 'completed';
    
    const updatedWorkflow = {
      ...project.workflow,
      steps: updatedSteps,
      currentStep: nextStepName
    };
    
    try {
      await saveProject({ workflow: updatedWorkflow });
      setProject(prev => ({ ...prev, workflow: updatedWorkflow }));
    } catch (error) {
      console.error('Failed to advance workflow step:', error);
    }
  };

  const returnToWorkflowStep = async (stepIndex) => {
    if (!project?.workflow?.steps || stepIndex < 0) return;
    
    const updatedSteps = [...project.workflow.steps];
    
    // Mark all steps after the target step as pending
    for (let i = stepIndex + 1; i < updatedSteps.length; i++) {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'pending',
        completedAt: null
      };
    }
    
    // Mark target step as in-progress
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      status: 'in-progress',
      completedAt: null
    };
    
    const stepName = updatedSteps[stepIndex].name.toLowerCase().replace(/\s+/g, '-');
    
    const updatedWorkflow = {
      ...project.workflow,
      steps: updatedSteps,
      currentStep: stepName
    };
    
    try {
      await saveProject({ workflow: updatedWorkflow });
      setProject(prev => ({ ...prev, workflow: updatedWorkflow }));
    } catch (error) {
      console.error('Failed to return to workflow step:', error);
    }
  };

  // Delete project function
  const deleteProject = async () => {
    if (!project?.id) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to projects page after successful deletion
        router.push('/projects');
      } else {
        const error = await response.json();
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('An error occurred while deleting the project.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

  // User management functions
  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProject(prev => ({
            ...prev,
            teamMembers: [...(prev.teamMembers || []), data.user]
          }));
          setNewUserEmail('');
          setNewUserRole('viewer');
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUserRole = async (userEmail, newRole) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/users/${userEmail}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        setProject(prev => ({
          ...prev,
          teamMembers: prev.teamMembers.map(member => 
            member.email === userEmail ? { ...member, role: newRole } : member
          )
        }));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleRemoveUser = async (userEmail) => {
    if (!confirm('Are you sure you want to remove this user from the project?')) return;
    
    try {
      const response = await fetch(`/api/projects/${project.id}/users/${userEmail}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProject(prev => ({
          ...prev,
          teamMembers: prev.teamMembers.filter(member => member.email !== userEmail)
        }));
      }
    } catch (error) {
      console.error('Error removing user:', error);
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <p className="text-gray-300 mt-1">{project.description}</p>
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
                onClick={() => setShowProjectSettings(true)}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Project Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={() => setShowProjectUsers(true)}
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
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'tools', label: 'Tools', icon: Brain },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-500'
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
                    {project.criteria?.inclusion?.length > 0 ? (
                      <ul className="text-gray-600 space-y-1">
                        {project.criteria.inclusion.map((criterion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{String(criterion)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No inclusion criteria defined</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Exclusion Criteria</h3>
                    {project.criteria?.exclusion?.length > 0 ? (
                      <ul className="text-gray-600 space-y-1">
                        {project.criteria.exclusion.map((criterion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{String(criterion)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm italic">No exclusion criteria defined</p>
                    )}
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

            {/* Workflow Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Status</h2>
              
              {/* Workflow Type and Current Step */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {project.workflow?.type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Systematic Review'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {(project.workflow?.steps || []).length || 5} steps
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Current Step: {project.workflow?.currentStep?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Upload'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, Math.round(((project.statistics?.screenedDocuments || 0) + (project.statistics?.includedDocuments || 0)) / Math.max(project.statistics?.totalDocuments || 1, 1) * 100))}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-3">
                {(project.workflow?.steps || [
                  { name: 'Document Upload', status: 'in-progress' },
                  { name: 'Document Screening', status: 'pending' },
                  { name: 'Data Extraction', status: 'pending' },
                  { name: 'Quality Assessment', status: 'pending' },
                  { name: 'Synthesis & Analysis', status: 'pending' },
                ]).map((step, index) => {
                  // Ensure first step is in-progress if no steps are completed
                  const isFirstStep = index === 0;
                  const hasCompletedSteps = (project.workflow?.steps || []).some(s => s.status === 'completed');
                  const shouldBeInProgress = isFirstStep && !hasCompletedSteps;
                  
                  const actualStep = shouldBeInProgress ? { ...step, status: 'in-progress' } : step;
                  const isCompleted = actualStep.status === 'completed';
                  const isInProgress = actualStep.status === 'in-progress';
                  const isPending = actualStep.status === 'pending';
                  const canAdvance = isInProgress; // Allow completion of any in-progress step
                  const canReturn = isCompleted || (isInProgress && index > 0);
                  
                  // Debug logging
                  console.log(`Step ${index}: ${actualStep.name}`, {
                    status: actualStep.status,
                    isInProgress,
                    canAdvance,
                    canReturn
                  });
                  
                  // Define step routes
                  const getStepRoute = (stepName) => {
                    const stepRoutes = {
                      'Document Upload': `/projects/${params.id}/upload`,
                      'Document Screening': `/projects/${params.id}/screening`,
                      'Data Extraction': `/projects/${params.id}/extraction`,
                      'Quality Assessment': `/projects/${params.id}/quality`,
                      'Statistical Analysis': `/projects/${params.id}/analysis`,
                      'Synthesis & Analysis': `/projects/${params.id}/synthesis`,
                    };
                    return stepRoutes[stepName] || '#';
                  };

                  const stepRoute = getStepRoute(actualStep.name);
                  const isClickable = stepRoute !== '#';

                  return (
                    <Link 
                      key={index} 
                      href={stepRoute}
                      className={`flex items-center p-4 rounded-lg border transition-all ${
                        isCompleted 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : isInProgress
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : isInProgress
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-medium ${
                            isCompleted ? 'text-green-900' : 
                            isInProgress ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {actualStep.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {isCompleted && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                Completed
                              </span>
                            )}
                            {isInProgress && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                In Progress
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          {actualStep.completedAt && (
                            <span>Completed: {new Date(actualStep.completedAt).toLocaleDateString()}</span>
                          )}
                          {actualStep.assignedTo && (
                            <span>Assigned to: {actualStep.assignedTo}</span>
                          )}
                          {!actualStep.completedAt && !actualStep.assignedTo && (
                            <span>Not started</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {canReturn && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              returnToWorkflowStep(index);
                            }}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            title="Return to this step"
                          >
                            Return
                          </button>
                        )}
                        {canAdvance && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              advanceWorkflowStep(index);
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            title="Complete this step and advance"
                          >
                            Complete
                          </button>
                        )}
                        {isPending && index > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              returnToWorkflowStep(index);
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Start this step"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                }) || (
                  <div className="text-center text-gray-500 py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-gray-400">📋</span>
                    </div>
                    <p className="font-medium">No workflow steps defined</p>
                    <p className="text-sm mt-1 mb-4">Initialize workflow steps for this project</p>
                    <button
                      onClick={async () => {
                        const defaultWorkflow = {
                          type: 'systematic-review',
                          currentStep: 'upload',
                          steps: [
                            { name: 'Document Upload', status: 'in-progress' },
                            { name: 'Document Screening', status: 'pending' },
                            { name: 'Data Extraction', status: 'pending' },
                            { name: 'Quality Assessment', status: 'pending' },
                            { name: 'Synthesis & Analysis', status: 'pending' },
                          ]
                        };
                        try {
                          await saveProject({ workflow: defaultWorkflow });
                          setProject(prev => ({ ...prev, workflow: defaultWorkflow }));
                        } catch (error) {
                          console.error('Failed to initialize workflow:', error);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Initialize Workflow
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Documents
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View Documents
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* PRISMA Flow */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">PRISMA Flow Diagram</h2>
              
              {/* PRISMA Flow Visualization */}
              <div className="space-y-4">
                {/* Identification */}
                <div className="flex justify-center">
                  <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 text-center min-w-[200px]">
                    <div className="text-2xl font-bold text-blue-800">
                      {project.prismaData?.identified || project.statistics?.totalDocuments || 0}
                    </div>
                    <div className="text-sm text-blue-600">Records identified</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ArrowDown size={24} className="text-gray-400" />
                </div>
                
                {/* Screening */}
                <div className="flex justify-center gap-8">
                  <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center min-w-[150px]">
                    <div className="text-xl font-bold text-yellow-800">
                      {project.prismaData?.screened || project.statistics?.screenedDocuments || 0}
                    </div>
                    <div className="text-sm text-yellow-600">Records screened</div>
                  </div>
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center min-w-[150px]">
                    <div className="text-xl font-bold text-red-800">
                      {(project.prismaData?.screened || project.statistics?.screenedDocuments || 0) - 
                       (project.prismaData?.assessed || project.statistics?.includedDocuments || 0)}
                    </div>
                    <div className="text-sm text-red-600">Records excluded</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ArrowDown size={24} className="text-gray-400" />
                </div>
                
                {/* Eligibility */}
                <div className="flex justify-center gap-8">
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center min-w-[150px]">
                    <div className="text-xl font-bold text-green-800">
                      {project.prismaData?.assessed || project.statistics?.includedDocuments || 0}
                    </div>
                    <div className="text-sm text-green-600">Full-text assessed</div>
                  </div>
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center min-w-[150px]">
                    <div className="text-xl font-bold text-red-800">
                      {(project.prismaData?.assessed || project.statistics?.includedDocuments || 0) - 
                       (project.prismaData?.included || project.statistics?.includedDocuments || 0)}
                    </div>
                    <div className="text-sm text-red-600">Full-text excluded</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <ArrowDown size={24} className="text-gray-400" />
                </div>
                
                {/* Studies Included */}
                <div className="flex justify-center">
                  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 text-center min-w-[200px]">
                    <div className="text-2xl font-bold text-purple-800">
                      {project.prismaData?.included || project.statistics?.includedDocuments || 0}
                    </div>
                    <div className="text-sm text-purple-600">Studies included in synthesis</div>
                  </div>
                </div>
              </div>

              {/* Exclusion Reasons Breakdown */}
              {project.prismaData?.excludedReasons && Object.keys(project.prismaData.excludedReasons).length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Exclusion Reasons</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(project.prismaData.excludedReasons).map(([reason, count]) => (
                      <div key={reason} className="flex justify-between items-center bg-white rounded-lg p-3">
                        <span className="text-sm text-gray-700">{reason}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Statistics */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Summary Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {project.prismaData?.identified || project.statistics?.totalDocuments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Identified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {project.prismaData?.screened || project.statistics?.screenedDocuments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Screened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {project.prismaData?.assessed || project.statistics?.includedDocuments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Assessed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {project.prismaData?.included || project.statistics?.includedDocuments || 0}
                    </div>
                    <div className="text-xs text-gray-500">Included</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <div className="flex gap-3">
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


        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            project={project} 
            documents={documents} 
            users={project?.teamMembers || []} 
          />
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6">
            {/* Tools Sub-Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'search', label: 'Search & Filter', icon: Search },
                    { id: 'export', label: 'Export Data', icon: Download },
                    { id: 'ontology', label: 'Ontology', icon: Target },
                    { id: 'ai', label: 'AI Assistant', icon: Brain },
                    { id: 'visualizations', label: 'Visualizations', icon: BarChart3 },
                    { id: 'collaboration', label: 'Collaboration', icon: MessageCircle },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTool === tool.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tool.icon size={16} />
                      {tool.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tool Content */}
              <div className="p-6">
                {activeTool === 'search' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Search size={24} className="text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Advanced search and filtering capabilities for your documents</p>
                    <AdvancedSearch 
                      documents={documents} 
                      onResults={setSearchResults}
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Search Results</h4>
                        <div className="space-y-3">
                          {searchResults.map((doc) => (
                            <div key={doc.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <h5 className="font-medium text-gray-900">{doc.metadata?.title || doc.fileName}</h5>
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.metadata?.authors?.join(', ') || 'Unknown authors'}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>Tables: {doc.tables?.length || 0}</span>
                                <span>Status: {getScreeningStatus(doc).status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTool === 'export' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Download size={24} className="text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Export your project data in various formats</p>
                    <ExportManager 
                      project={project}
                      documents={documents}
                      extractedData={documents.flatMap(doc => doc.extractedData || [])}
                    />
                  </div>
                )}

                {activeTool === 'ontology' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Target size={24} className="text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Ontology Management</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Concept mapping and ontology integration for your research</p>
                    <OntologyManager 
                      project={project}
                      documents={documents}
                      onConceptMapping={(mapping) => {
                        console.log('Concept mapping:', mapping);
                      }}
                    />
                  </div>
                )}

                {activeTool === 'ai' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain size={24} className="text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                    </div>
                    <p className="text-gray-600 mb-4">AI-powered insights and suggestions for your systematic review</p>
                    <AIAssistant 
                      project={project}
                      documents={documents}
                      onAIAnalysis={(analysis) => {
                        console.log('AI analysis:', analysis);
                      }}
                    />
                  </div>
                )}

                {activeTool === 'visualizations' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 size={24} className="text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Visualizations</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Interactive charts and PRISMA flow diagrams</p>
                    <InteractiveCharts 
                      project={project}
                      documents={documents}
                      onChartUpdate={(chart) => {
                        console.log('Chart updated:', chart);
                      }}
                    />
                  </div>
                )}

                {activeTool === 'collaboration' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle size={24} className="text-pink-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Collaboration</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Team communication and task management tools</p>
                    <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                      <CollaborationPanel 
                        project={project}
                        currentUser={session?.user}
                        onUpdate={fetchProjectData}
                        className="h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
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
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowCollaboration(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full w-fit bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Collaboration</h2>
              <button
                onClick={() => setShowCollaboration(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close collaboration panel"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <CollaborationPanel 
                project={project} 
                currentUser={session?.user} 
                onUpdate={fetchProjectData}
                className="h-full"
              />
            </div>
          </div>
        </>
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

      {/* Project Settings Modal */}
      {showProjectSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Settings</h2>
                <button
                  onClick={() => setShowProjectSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Project Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={project?.name || ''}
                        onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={project?.description || ''}
                        onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Research Question
                      </label>
                      <textarea
                        value={project?.researchQuestion || ''}
                        onChange={(e) => setProject(prev => ({ ...prev, researchQuestion: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Workflow Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Type
                      </label>
                      <select
                        value={project?.workflow?.type || 'systematic-review'}
                        onChange={(e) => setProject(prev => ({ 
                          ...prev, 
                          workflow: { 
                            ...prev.workflow, 
                            type: e.target.value 
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="systematic-review">Systematic Review</option>
                        <option value="scoping-review">Scoping Review</option>
                        <option value="rapid-review">Rapid Review</option>
                        <option value="meta-analysis">Meta-Analysis</option>
                        <option value="narrative-review">Narrative Review</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Status
                      </label>
                      <select
                        value={project?.status || 'draft'}
                        onChange={(e) => setProject(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Delete Project</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Permanently delete this project and all its data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowProjectSettings(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await saveProject(project);
                      setShowProjectSettings(false);
                    } catch (error) {
                      console.error('Failed to save project settings:', error);
                      alert('Failed to save settings. Please try again.');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "<strong>{project?.name}</strong>"? This action cannot be undone and will permanently remove all project data, documents, and settings.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteProject}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Users Modal */}
      {showProjectUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Users</h2>
                <button
                  onClick={() => setShowProjectUsers(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Add User Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add User to Project</h3>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      onClick={handleAddUser}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add User
                    </button>
                  </div>
                </div>

                {/* Current Users */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Users</h3>
                  <div className="space-y-3">
                    {project?.teamMembers?.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.email}</p>
                            <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select 
                            value={member.role}
                            onChange={(e) => handleUpdateUserRole(member.email, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button 
                            onClick={() => handleRemoveUser(member.email)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-8">
                        <Users size={48} className="mx-auto text-gray-400 mb-3" />
                        <p>No users assigned to this project</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowProjectUsers(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

