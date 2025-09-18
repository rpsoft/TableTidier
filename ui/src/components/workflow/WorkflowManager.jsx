'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  ArrowDown,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Zap,
  Target,
  FileText,
  Eye,
  Database
} from 'lucide-react';

export default function WorkflowManager({ project, onWorkflowUpdate }) {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Mock workflow templates
  const workflowTemplates = [
    {
      id: 'systematic-review',
      name: 'Systematic Review Workflow',
      description: 'Complete systematic review process from screening to synthesis',
      steps: [
        { id: 'upload', name: 'Document Upload', type: 'upload', required: true },
        { id: 'screening', name: 'Title/Abstract Screening', type: 'screening', required: true },
        { id: 'full-text', name: 'Full-text Review', type: 'screening', required: true },
        { id: 'extraction', name: 'Data Extraction', type: 'extraction', required: true },
        { id: 'quality', name: 'Quality Assessment', type: 'quality', required: true },
        { id: 'synthesis', name: 'Data Synthesis', type: 'synthesis', required: false }
      ],
      estimatedDuration: '4-6 weeks',
      complexity: 'High'
    },
    {
      id: 'rapid-review',
      name: 'Rapid Review Workflow',
      description: 'Streamlined review process for time-sensitive projects',
      steps: [
        { id: 'upload', name: 'Document Upload', type: 'upload', required: true },
        { id: 'screening', name: 'Single-stage Screening', type: 'screening', required: true },
        { id: 'extraction', name: 'Key Data Extraction', type: 'extraction', required: true },
        { id: 'synthesis', name: 'Rapid Synthesis', type: 'synthesis', required: false }
      ],
      estimatedDuration: '1-2 weeks',
      complexity: 'Medium'
    },
    {
      id: 'scoping-review',
      name: 'Scoping Review Workflow',
      description: 'Broad mapping of literature without quality assessment',
      steps: [
        { id: 'upload', name: 'Document Upload', type: 'upload', required: true },
        { id: 'screening', name: 'Broad Screening', type: 'screening', required: true },
        { id: 'extraction', name: 'Descriptive Extraction', type: 'extraction', required: true },
        { id: 'mapping', name: 'Evidence Mapping', type: 'mapping', required: true }
      ],
      estimatedDuration: '2-3 weeks',
      complexity: 'Medium'
    }
  ];

  useEffect(() => {
    loadWorkflows();
  }, [project]);

  const loadWorkflows = async () => {
    try {
      const response = await fetch(`/api/workflows?projectId=${project.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkflows(data.workflows);
          if (data.workflows.length > 0) {
            setActiveWorkflow(data.workflows[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      // Fallback to mock data
      const mockWorkflows = [
        {
          id: 'wf1',
          name: 'Current Systematic Review',
          template: 'systematic-review',
          status: 'running',
          progress: 65,
          currentStep: 3,
          steps: workflowTemplates[0].steps,
          assignedUsers: ['user1', 'user2'],
          createdAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedCompletion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setWorkflows(mockWorkflows);
      setActiveWorkflow(mockWorkflows[0]);
    }
  };

  const createWorkflow = async (template) => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          template: template.id,
          steps: template.steps,
          assignedUsers: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWorkflows(prev => [data.workflow, ...prev]);
          setActiveWorkflow(data.workflow);
          setShowCreateModal(false);
        }
      } else {
        throw new Error('Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      // Fallback to local creation
      const newWorkflow = {
        id: `wf_${Date.now()}`,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        template: template.id,
        status: 'draft',
        progress: 0,
        currentStep: 0,
        steps: template.steps,
        assignedUsers: [],
        createdAt: new Date().toISOString(),
        startedAt: null,
        estimatedCompletion: null
      };
      
      setWorkflows(prev => [newWorkflow, ...prev]);
      setActiveWorkflow(newWorkflow);
      setShowCreateModal(false);
    }
  };

  const startWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: 'running', startedAt: new Date().toISOString() }
        : wf
    ));
    setIsRunning(true);
    setWorkflowProgress(0);
    setCurrentStep(0);
  };

  const pauseWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: 'paused' }
        : wf
    ));
    setIsRunning(false);
  };

  const stopWorkflow = (workflowId) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: 'stopped' }
        : wf
    ));
    setIsRunning(false);
    setWorkflowProgress(0);
    setCurrentStep(0);
  };

  const completeStep = (workflowId, stepId) => {
    setWorkflows(prev => prev.map(wf => {
      if (wf.id === workflowId) {
        const stepIndex = wf.steps.findIndex(step => step.id === stepId);
        const newProgress = Math.round(((stepIndex + 1) / wf.steps.length) * 100);
        return {
          ...wf,
          progress: newProgress,
          currentStep: stepIndex + 1,
          status: newProgress === 100 ? 'completed' : wf.status
        };
      }
      return wf;
    }));
    
    setWorkflowProgress(prev => {
      const workflow = workflows.find(wf => wf.id === workflowId);
      const stepIndex = workflow.steps.findIndex(step => step.id === stepId);
      return Math.round(((stepIndex + 1) / workflow.steps.length) * 100);
    });
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'upload': return <FileText size={20} />;
      case 'screening': return <Eye size={20} />;
      case 'extraction': return <Database size={20} />;
      case 'quality': return <Target size={20} />;
      case 'synthesis': return <Zap size={20} />;
      case 'mapping': return <Target size={20} />;
      default: return <CheckCircle size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'stopped': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play size={16} />;
      case 'paused': return <Pause size={16} />;
      case 'stopped': return <Square size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'draft': return <Edit size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings size={28} />
              Workflow Management
            </h1>
            <p className="text-gray-600 mt-1">
              Create, manage, and automate systematic review workflows
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              Create Workflow
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Active Workflow Status */}
      {activeWorkflow && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Workflow</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(activeWorkflow.status)}`}>
                {getStatusIcon(activeWorkflow.status)}
                {activeWorkflow.status}
              </span>
              {activeWorkflow.status === 'running' && (
                <button
                  onClick={() => pauseWorkflow(activeWorkflow.id)}
                  className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg"
                >
                  <Pause size={16} />
                </button>
              )}
              {activeWorkflow.status === 'paused' && (
                <button
                  onClick={() => startWorkflow(activeWorkflow.id)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                >
                  <Play size={16} />
                </button>
              )}
              <button
                onClick={() => stopWorkflow(activeWorkflow.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
              >
                <Square size={16} />
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{activeWorkflow.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeWorkflow.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Step:</span>
              <span className="ml-2 font-medium">
                {activeWorkflow.steps[activeWorkflow.currentStep]?.name || 'Completed'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 font-medium">
                {activeWorkflow.startedAt ? new Date(activeWorkflow.startedAt).toLocaleDateString() : 'Not started'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estimated Completion:</span>
              <span className="ml-2 font-medium">
                {activeWorkflow.estimatedCompletion ? new Date(activeWorkflow.estimatedCompletion).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Steps */}
      {activeWorkflow && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Steps</h2>
          <div className="space-y-4">
            {activeWorkflow.steps.map((step, index) => (
              <div key={step.id} className={`flex items-center p-4 rounded-lg border ${
                index < activeWorkflow.currentStep 
                  ? 'bg-green-50 border-green-200' 
                  : index === activeWorkflow.currentStep 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index < activeWorkflow.currentStep 
                      ? 'bg-green-500 text-white' 
                      : index === activeWorkflow.currentStep 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < activeWorkflow.currentStep ? (
                      <CheckCircle size={16} />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStepIcon(step.type)}
                    <span className="font-medium text-gray-900">{step.name}</span>
                    {step.required && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                </div>
                
                {index === activeWorkflow.currentStep && activeWorkflow.status === 'running' && (
                  <div className="ml-auto">
                    <button
                      onClick={() => completeStep(activeWorkflow.id, step.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Complete Step
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Workflows */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Workflows</h2>
        <div className="space-y-4">
          {workflows.map(workflow => (
            <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-600">
                      Template: {workflowTemplates.find(t => t.id === workflow.template)?.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(workflow.status)}`}>
                    {getStatusIcon(workflow.status)}
                    {workflow.status}
                  </span>
                  <div className="text-sm text-gray-600">
                    {workflow.progress}% complete
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveWorkflow(workflow)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded text-sm"
                  >
                    View
                  </button>
                  {workflow.status === 'draft' && (
                    <button
                      onClick={() => startWorkflow(workflow.id)}
                      className="px-3 py-1 text-green-600 hover:bg-green-100 rounded text-sm"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => setEditingWorkflow(workflow)}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Workflow</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Square size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflowTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => createWorkflow(template)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{template.estimatedDuration}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.complexity === 'High' ? 'bg-red-100 text-red-800' :
                        template.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {template.complexity}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      {template.steps.length} steps
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
