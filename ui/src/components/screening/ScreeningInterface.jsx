'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, MessageSquare, Save, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ScreeningInterface({ document, project, onDecision, onNext, onPrevious, currentIndex, totalDocuments }) {
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDecision, setSavedDecision] = useState(null);

  useEffect(() => {
    if (document?.screening?.length > 0) {
      const latestScreening = document.screening[document.screening.length - 1];
      setDecision(latestScreening.decision);
      setReason(latestScreening.reason || '');
      setSavedDecision(latestScreening);
    } else {
      setDecision('');
      setReason('');
      setSavedDecision(null);
    }
  }, [document]);

  const handleDecision = async (newDecision) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onDecision(document.id, newDecision, reason);
      setDecision(newDecision);
      setSavedDecision({
        decision: newDecision,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonChange = (newReason) => {
    setReason(newReason);
    // Auto-save reason if decision is already made
    if (decision && savedDecision) {
      handleDecision(decision);
    }
  };

  const getDecisionColor = (decisionType) => {
    switch (decisionType) {
      case 'included': return 'text-green-600 bg-green-50 border-green-200';
      case 'excluded': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDecisionIcon = (decisionType) => {
    switch (decisionType) {
      case 'included': return <CheckCircle size={20} />;
      case 'excluded': return <XCircle size={20} />;
      case 'pending': return <Clock size={20} />;
      default: return <Clock size={20} />;
    }
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
          <p className="text-gray-600">Select a document to begin screening</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Document Screening</h1>
            <div className="text-sm text-gray-500">
              Document {currentIndex + 1} of {totalDocuments}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalDocuments - 1}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalDocuments) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-gray-900 font-medium">{document.metadata?.title || 'Untitled'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Authors</label>
                <p className="text-gray-900">{document.metadata?.authors?.join(', ') || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Journal</label>
                <p className="text-gray-900">{document.metadata?.journal || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Year</label>
                <p className="text-gray-900">{document.metadata?.year || 'Unknown'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">DOI</label>
                <p className="text-gray-900">{document.metadata?.doi || 'Not available'}</p>
              </div>
            </div>
          </div>

          {/* Abstract */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Abstract</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {document.metadata?.abstract || 'No abstract available'}
              </p>
            </div>
          </div>

          {/* Keywords */}
          {document.metadata?.keywords && document.metadata.keywords.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {document.metadata.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tables */}
          {document.tables && document.tables.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tables ({document.tables.length})</h2>
              <div className="space-y-4">
                {document.tables.map((table, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Table {index + 1}</h3>
                    <div className="text-sm text-gray-600">
                      {table.headers?.length || 0} columns × {table.rows?.length || 0} rows
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Screening Panel */}
        <div className="space-y-6">
          {/* Project Criteria */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Criteria</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Inclusion Criteria</h3>
                <ul className="space-y-1">
                  {project.criteria?.inclusion?.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Exclusion Criteria</h3>
                <ul className="space-y-1">
                  {project.criteria?.exclusion?.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Screening Decision</h2>
            
            {/* Current Decision Status */}
            {savedDecision && (
              <div className={`mb-4 p-3 rounded-lg border ${getDecisionColor(savedDecision.decision)}`}>
                <div className="flex items-center gap-2">
                  {getDecisionIcon(savedDecision.decision)}
                  <span className="font-medium capitalize">{savedDecision.decision}</span>
                </div>
                {savedDecision.reason && (
                  <p className="text-sm mt-2">{savedDecision.reason}</p>
                )}
              </div>
            )}

            {/* Decision Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleDecision('included')}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  decision === 'included'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300 text-gray-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  <span className="font-medium">Include</span>
                </div>
              </button>

              <button
                onClick={() => handleDecision('excluded')}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  decision === 'excluded'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300 text-gray-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <XCircle size={20} />
                  <span className="font-medium">Exclude</span>
                </div>
              </button>

              <button
                onClick={() => handleDecision('pending')}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  decision === 'pending'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-yellow-300 text-gray-700'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock size={20} />
                  <span className="font-medium">Mark as Pending</span>
                </div>
              </button>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Decision
              </label>
              <textarea
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Enter reason for this decision..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            {/* Save Button */}
            {decision && (
              <button
                onClick={() => handleDecision(decision)}
                disabled={isSubmitting}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
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
            )}
          </div>

          {/* Screening History */}
          {document.screening && document.screening.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Screening History</h2>
              <div className="space-y-3">
                {document.screening.slice(0, -1).reverse().map((screening, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getDecisionIcon(screening.decision)}
                        <span className="font-medium capitalize">{screening.decision}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(screening.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {screening.reason && (
                      <p className="text-sm text-gray-600 mt-1">{screening.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
