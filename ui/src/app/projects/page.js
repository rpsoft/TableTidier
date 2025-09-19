'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Define workflow steps for different review types
  const getWorkflowSteps = (workflowType) => {
    const baseSteps = [
      { name: 'Document Upload', status: 'pending' },
      { name: 'Document Screening', status: 'pending' },
      { name: 'Data Extraction', status: 'pending' },
      { name: 'Quality Assessment', status: 'pending' },
      { name: 'Synthesis & Analysis', status: 'pending' },
    ];

    switch (workflowType) {
      case 'scoping-review':
        return [
          { name: 'Document Upload', status: 'pending' },
          { name: 'Document Screening', status: 'pending' },
          { name: 'Data Extraction', status: 'pending' },
          { name: 'Synthesis & Analysis', status: 'pending' },
        ];
      case 'rapid-review':
        return [
          { name: 'Document Upload', status: 'pending' },
          { name: 'Document Screening', status: 'pending' },
          { name: 'Data Extraction', status: 'pending' },
          { name: 'Synthesis & Analysis', status: 'pending' },
        ];
      case 'meta-analysis':
        return [
          { name: 'Document Upload', status: 'pending' },
          { name: 'Document Screening', status: 'pending' },
          { name: 'Data Extraction', status: 'pending' },
          { name: 'Quality Assessment', status: 'pending' },
          { name: 'Statistical Analysis', status: 'pending' },
          { name: 'Synthesis & Analysis', status: 'pending' },
        ];
      case 'narrative-review':
        return [
          { name: 'Document Upload', status: 'pending' },
          { name: 'Document Screening', status: 'pending' },
          { name: 'Data Extraction', status: 'pending' },
          { name: 'Synthesis & Analysis', status: 'pending' },
        ];
      default:
        return baseSteps;
    }
  };
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    researchQuestion: '',
    inclusionCriteria: '',
    exclusionCriteria: '',
    workflowType: 'systematic-review',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description,
          researchQuestion: newProject.researchQuestion,
          criteria: {
            inclusion: newProject.inclusionCriteria.split('\n').filter(c => c.trim()),
            exclusion: newProject.exclusionCriteria.split('\n').filter(c => c.trim()),
          },
          workflow: {
            type: newProject.workflowType,
            currentStep: 'upload',
            steps: getWorkflowSteps(newProject.workflowType),
          },
        }),
      });

      if (response.ok) {
        const project = await response.json();
        router.push(`/projects/${project.id}`);
      } else {
        console.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'archived': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Systematic Review Projects</h1>
            <p className="mt-2 text-gray-300">
              Manage your systematic review projects and collaborate with your team
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-gray-300 mb-6">Get started by creating your first systematic review project</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {project.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>

                {project.researchQuestion && (
                  <p className="text-gray-700 text-sm mb-4 italic">
                    &quot;{project.researchQuestion}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <FileText size={16} />
                      <span>{project.statistics?.totalDocuments || 0} docs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{project.teamMembers?.length || 0} members</span>
                    </div>
                  </div>
                  <span className="text-xs">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Progress indicators */}
                {project.statistics && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Screened</span>
                      <span>{project.statistics.screenedDocuments}/{project.statistics.totalDocuments}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${project.statistics.totalDocuments > 0 
                            ? (project.statistics.screenedDocuments / project.statistics.totalDocuments) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <form onSubmit={handleCreateProject} className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Create New Project</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="Brief description of the systematic review"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Research Question
                    </label>
                    <textarea
                      value={newProject.researchQuestion}
                      onChange={(e) => setNewProject({ ...newProject, researchQuestion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="What is the main research question?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Review Type *
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          id: 'systematic-review',
                          title: 'Systematic Review',
                          description: 'Comprehensive review following PRISMA guidelines',
                          steps: ['Upload', 'Screening', 'Extraction', 'Quality Assessment', 'Synthesis'],
                          color: 'blue'
                        },
                        {
                          id: 'scoping-review',
                          title: 'Scoping Review',
                          description: 'Broad overview to map existing literature',
                          steps: ['Upload', 'Screening', 'Extraction', 'Synthesis'],
                          color: 'green'
                        },
                        {
                          id: 'rapid-review',
                          title: 'Rapid Review',
                          description: 'Accelerated review for time-sensitive decisions',
                          steps: ['Upload', 'Screening', 'Extraction', 'Synthesis'],
                          color: 'yellow'
                        },
                        {
                          id: 'meta-analysis',
                          title: 'Meta-Analysis',
                          description: 'Statistical synthesis of quantitative studies',
                          steps: ['Upload', 'Screening', 'Extraction', 'Quality Assessment', 'Statistical Analysis', 'Synthesis'],
                          color: 'purple'
                        },
                        {
                          id: 'narrative-review',
                          title: 'Narrative Review',
                          description: 'Qualitative synthesis of literature',
                          steps: ['Upload', 'Screening', 'Extraction', 'Synthesis'],
                          color: 'indigo'
                        }
                      ].map((workflow) => (
                        <div
                          key={workflow.id}
                          onClick={() => setNewProject({ ...newProject, workflowType: workflow.id })}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            newProject.workflowType === workflow.id
                              ? `border-${workflow.color}-500 bg-${workflow.color}-50`
                              : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold ${
                                newProject.workflowType === workflow.id ? 'text-gray-900' : 'text-white'
                              }`}>
                                {workflow.title}
                              </h3>
                              <p className={`text-sm mt-1 ${
                                newProject.workflowType === workflow.id ? 'text-gray-600' : 'text-gray-300'
                              }`}>
                                {workflow.description}
                              </p>
                              <div className="mt-2">
                                <p className={`text-xs font-medium ${
                                  newProject.workflowType === workflow.id ? 'text-gray-700' : 'text-gray-400'
                                }`}>
                                  Workflow Steps ({workflow.steps.length}):
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {workflow.steps.map((step, index) => (
                                    <span
                                      key={index}
                                      className={`px-2 py-1 text-xs rounded ${
                                        newProject.workflowType === workflow.id
                                          ? `bg-${workflow.color}-100 text-${workflow.color}-700`
                                          : 'bg-gray-600 text-gray-300'
                                      }`}
                                    >
                                      {step}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className={`ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              newProject.workflowType === workflow.id
                                ? `border-${workflow.color}-500 bg-${workflow.color}-500`
                                : 'border-gray-400'
                            }`}>
                              {newProject.workflowType === workflow.id && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Click on a workflow type to select it. Each type has different steps optimized for the review methodology.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Inclusion Criteria
                    </label>
                    <textarea
                      value={newProject.inclusionCriteria}
                      onChange={(e) => setNewProject({ ...newProject, inclusionCriteria: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="Enter inclusion criteria (one per line)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Exclusion Criteria
                    </label>
                    <textarea
                      value={newProject.exclusionCriteria}
                      onChange={(e) => setNewProject({ ...newProject, exclusionCriteria: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="Enter exclusion criteria (one per line)"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 border border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
