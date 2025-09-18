'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Save,
  BarChart3,
  FileText,
  Star,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function QualityAssessment({ document, onSave }) {
  const [assessment, setAssessment] = useState({
    overallScore: 0,
    criteria: {
      randomization: { score: 0, comment: '' },
      allocationConcealment: { score: 0, comment: '' },
      blindingParticipants: { score: 0, comment: '' },
      blindingOutcome: { score: 0, comment: '' },
      incompleteOutcomeData: { score: 0, comment: '' },
      selectiveReporting: { score: 0, comment: '' },
      otherBias: { score: 0, comment: '' }
    },
    additionalNotes: '',
    assessedBy: '',
    assessmentDate: new Date().toISOString()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (document?.qualityAssessment) {
      setAssessment(document.qualityAssessment);
    }
  }, [document]);

  const qualityCriteria = [
    {
      id: 'randomization',
      name: 'Random Sequence Generation',
      description: 'Was the allocation sequence adequately generated?',
      options: [
        { value: 0, label: 'High Risk', description: 'No random sequence generation' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'Adequate random sequence generation' }
      ]
    },
    {
      id: 'allocationConcealment',
      name: 'Allocation Concealment',
      description: 'Was allocation adequately concealed?',
      options: [
        { value: 0, label: 'High Risk', description: 'No allocation concealment' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'Adequate allocation concealment' }
      ]
    },
    {
      id: 'blindingParticipants',
      name: 'Blinding of Participants',
      description: 'Was knowledge of the allocated intervention adequately prevented?',
      options: [
        { value: 0, label: 'High Risk', description: 'No blinding or incomplete blinding' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'Adequate blinding of participants' }
      ]
    },
    {
      id: 'blindingOutcome',
      name: 'Blinding of Outcome Assessment',
      description: 'Was knowledge of the allocated intervention adequately prevented?',
      options: [
        { value: 0, label: 'High Risk', description: 'No blinding or incomplete blinding' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'Adequate blinding of outcome assessors' }
      ]
    },
    {
      id: 'incompleteOutcomeData',
      name: 'Incomplete Outcome Data',
      description: 'Were incomplete outcome data adequately addressed?',
      options: [
        { value: 0, label: 'High Risk', description: 'Incomplete outcome data not addressed' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'Incomplete outcome data adequately addressed' }
      ]
    },
    {
      id: 'selectiveReporting',
      name: 'Selective Outcome Reporting',
      description: 'Are reports of the study free of selective outcome reporting?',
      options: [
        { value: 0, label: 'High Risk', description: 'Selective outcome reporting detected' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'No selective outcome reporting' }
      ]
    },
    {
      id: 'otherBias',
      name: 'Other Sources of Bias',
      description: 'Was the study apparently free of other problems that could put it at risk of bias?',
      options: [
        { value: 0, label: 'High Risk', description: 'Other sources of bias detected' },
        { value: 1, label: 'Unclear Risk', description: 'Insufficient information' },
        { value: 2, label: 'Low Risk', description: 'No other sources of bias' }
      ]
    }
  ];

  const handleCriterionChange = (criterionId, score) => {
    setAssessment(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionId]: {
          ...prev.criteria[criterionId],
          score
        }
      }
    }));
  };

  const handleCommentChange = (criterionId, comment) => {
    setAssessment(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [criterionId]: {
          ...prev.criteria[criterionId],
          comment
        }
      }
    }));
  };

  const calculateOverallScore = () => {
    const scores = Object.values(assessment.criteria).map(c => c.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const maxScore = scores.length * 2; // Maximum possible score
    return Math.round((totalScore / maxScore) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle size={16} className="text-green-600" />;
    if (score >= 60) return <AlertTriangle size={16} className="text-yellow-600" />;
    return <XCircle size={16} className="text-red-600" />;
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Moderate Risk';
    return 'High Risk';
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updatedAssessment = {
        ...assessment,
        overallScore: overallScore,
        assessedBy: 'current-user', // This should come from session
        assessmentDate: new Date().toISOString()
      };
      
      await onSave?.(document.id, updatedAssessment);
      
      // Show success message
      console.log('Quality assessment saved successfully');
    } catch (error) {
      console.error('Error saving quality assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quality Assessment</h1>
            <p className="text-gray-600 mt-1">
              Risk of bias assessment for: {document?.metadata?.title || 'Document'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${getScoreColor(overallScore)}`}>
              {getScoreIcon(overallScore)}
              <span className="font-medium">{overallScore}% - {getRiskLevel(overallScore)}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Assessment
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Score Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          Overall Quality Score
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <p className="text-sm text-gray-600 mt-2">Overall Score</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Low Risk (80-100%)</span>
              <span className="text-green-600">●</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Moderate Risk (60-79%)</span>
              <span className="text-yellow-600">●</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>High Risk (0-59%)</span>
              <span className="text-red-600">●</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Assessment Criteria:</p>
            <p>• Random sequence generation</p>
            <p>• Allocation concealment</p>
            <p>• Blinding of participants</p>
            <p>• Blinding of outcome assessment</p>
            <p>• Incomplete outcome data</p>
            <p>• Selective outcome reporting</p>
            <p>• Other sources of bias</p>
          </div>
        </div>
      </div>

      {/* Quality Criteria Assessment */}
      <div className="space-y-6">
        {qualityCriteria.map((criterion) => (
          <div key={criterion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {criterion.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {criterion.description}
              </p>
              
              {/* Score Options */}
              <div className="space-y-3">
                {criterion.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                      assessment.criteria[criterion.id].score === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={criterion.id}
                      value={option.value}
                      checked={assessment.criteria[criterion.id].score === option.value}
                      onChange={() => handleCriterionChange(criterion.id, option.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${
                          option.value === 0 ? 'text-red-600' :
                          option.value === 1 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {option.label}
                        </span>
                        {option.value === 0 && <XCircle size={16} className="text-red-600" />}
                        {option.value === 1 && <AlertTriangle size={16} className="text-yellow-600" />}
                        {option.value === 2 && <CheckCircle size={16} className="text-green-600" />}
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                value={assessment.criteria[criterion.id].comment}
                onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                placeholder="Add any additional comments or notes about this criterion..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} />
          Additional Notes
        </h2>
        <textarea
          value={assessment.additionalNotes}
          onChange={(e) => setAssessment(prev => ({ ...prev, additionalNotes: e.target.value }))}
          placeholder="Add any general comments about the study quality or methodology..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={4}
        />
      </div>

      {/* Assessment Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Criteria Scores</h3>
            <div className="space-y-2">
              {qualityCriteria.map((criterion) => {
                const score = assessment.criteria[criterion.id].score;
                const scoreText = criterion.options.find(opt => opt.value === score)?.label || 'Not assessed';
                return (
                  <div key={criterion.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{criterion.name}</span>
                    <span className={`font-medium ${
                      score === 0 ? 'text-red-600' :
                      score === 1 ? 'text-yellow-600' :
                      score === 2 ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {scoreText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Overall Assessment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Score:</span>
                <span className={`font-medium ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Level:</span>
                <span className={`font-medium ${getScoreColor(overallScore)}`}>
                  {getRiskLevel(overallScore)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assessed By:</span>
                <span className="font-medium">{assessment.assessedBy || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Assessment Date:</span>
                <span className="font-medium">
                  {new Date(assessment.assessmentDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Assessment
            </>
          )}
        </button>
      </div>
    </div>
  );
}
