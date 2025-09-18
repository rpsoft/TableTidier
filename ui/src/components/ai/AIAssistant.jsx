'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  MessageCircle, 
  Send, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  Target,
  FileText,
  BarChart3,
  Zap,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

export default function AIAssistant({ project, documents, onAIAnalysis }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [aiInsights, setAiInsights] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Mock AI responses
  const mockAIResponses = [
    "I've analyzed your systematic review data and found several interesting patterns. Would you like me to elaborate on any specific findings?",
    "Based on the extracted data, I can see that 78% of studies used randomized controlled trials. This suggests high-quality evidence for your research question.",
    "I notice some inconsistencies in your data extraction. Would you like me to help identify and resolve these issues?",
    "Your inclusion criteria seem well-defined. I can help you refine the exclusion criteria if needed.",
    "I've identified 5 studies that might have been missed in your initial search. Would you like me to suggest additional search terms?"
  ];

  const mockInsights = [
    {
      id: 'insight1',
      type: 'pattern',
      title: 'Study Design Distribution',
      description: 'Most studies (78%) used randomized controlled trials, indicating high-quality evidence.',
      confidence: 0.92,
      actionable: true,
      category: 'methodology'
    },
    {
      id: 'insight2',
      type: 'anomaly',
      title: 'Data Inconsistencies Detected',
      description: 'Found 3 studies with missing sample size data that may need verification.',
      confidence: 0.87,
      actionable: true,
      category: 'data_quality'
    },
    {
      id: 'insight3',
      type: 'suggestion',
      title: 'Search Strategy Optimization',
      description: 'Consider adding "efficacy" and "effectiveness" to your search terms for better coverage.',
      confidence: 0.85,
      actionable: true,
      category: 'search_strategy'
    },
    {
      id: 'insight4',
      type: 'trend',
      title: 'Publication Year Trend',
      description: 'Most relevant studies were published between 2018-2022, suggesting recent research focus.',
      confidence: 0.90,
      actionable: false,
      category: 'temporal'
    }
  ];

  const mockSuggestions = [
    {
      id: 'suggestion1',
      type: 'extraction',
      title: 'Extract Additional Variables',
      description: 'Consider extracting "adverse events" and "cost-effectiveness" data from included studies.',
      priority: 'high',
      effort: 'medium'
    },
    {
      id: 'suggestion2',
      type: 'screening',
      title: 'Refine Inclusion Criteria',
      description: 'Your current criteria might be too broad. Consider adding age restrictions.',
      priority: 'medium',
      effort: 'low'
    },
    {
      id: 'suggestion3',
      type: 'quality',
      title: 'Quality Assessment Needed',
      description: '5 studies lack quality assessment scores. This is required for meta-analysis.',
      priority: 'high',
      effort: 'high'
    }
  ];

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        content: "Hello! I'm your AI research assistant. I can help you analyze your systematic review data, identify patterns, suggest improvements, and answer questions about your research process. How can I assist you today?",
        timestamp: new Date().toISOString()
      }
    ]);
    
    // Load AI insights and suggestions
    setAiInsights(mockInsights);
    setSuggestions(mockSuggestions);
  }, [project]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      const context = `Project: ${project?.name || 'Unknown'}, Documents: ${documents.length}, Included: ${documents.filter(d => d.screening?.[d.screening.length - 1]?.decision === 'included').length}`;
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiResponse = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const runDocumentAnalysis = async () => {
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          documents
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze documents');
      }

      const data = await response.json();
      
      if (data.success) {
        const analysis = {
          id: `analysis_${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...data.analysis
        };

        setAnalysisResults(analysis);
        setAiInsights(data.analysis.insights || []);
        setSuggestions(data.analysis.recommendations?.map((rec, index) => ({
          id: `suggestion_${index}`,
          type: 'general',
          title: rec,
          description: rec,
          priority: 'medium',
          effort: 'low'
        })) || []);
        
        onAIAnalysis?.(analysis);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback to mock data
      const analysis = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        summary: {
          totalDocuments: documents.length,
          screenedDocuments: documents.filter(doc => doc.screening?.length > 0).length,
          includedDocuments: documents.filter(doc => {
            const latestScreening = doc.screening?.[doc.screening.length - 1];
            return latestScreening?.decision === 'included';
          }).length,
          dataQualityScore: 85,
          completenessScore: 78
        },
        insights: mockInsights,
        recommendations: mockSuggestions
      };
      setAnalysisResults(analysis);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionAccept = (suggestionId) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId 
        ? { ...s, accepted: true, acceptedAt: new Date().toISOString() }
        : s
    ));
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'pattern': return <BarChart3 size={20} className="text-blue-500" />;
      case 'anomaly': return <AlertCircle size={20} className="text-red-500" />;
      case 'suggestion': return <Lightbulb size={20} className="text-yellow-500" />;
      case 'trend': return <Target size={20} className="text-green-500" />;
      default: return <Brain size={20} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort) => {
    switch (effort) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain size={28} />
              AI Research Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Get AI-powered insights, suggestions, and analysis for your systematic review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runDocumentAnalysis}
              disabled={isTyping}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isTyping ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Analyze Documents
                </>
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'chat', label: 'Chat Assistant', icon: MessageCircle },
              { id: 'insights', label: 'AI Insights', icon: Lightbulb },
              { id: 'suggestions', label: 'Suggestions', icon: Target },
              { id: 'analysis', label: 'Document Analysis', icon: FileText }
            ].map(tab => (
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

        <div className="p-6">
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader size={16} className="animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your systematic review..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">AI-Generated Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiInsights.map(insight => (
                  <div key={insight.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            insight.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                            insight.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                          {insight.actionable && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              Take Action
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
              <div className="space-y-3">
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} className={`border rounded-lg p-4 ${
                    suggestion.accepted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{suggestion.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority} priority
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getEffortColor(suggestion.effort)}`}>
                            {suggestion.effort} effort
                          </span>
                        </div>
                      </div>
                      {!suggestion.accepted && (
                        <button
                          onClick={() => handleSuggestionAccept(suggestion.id)}
                          className="ml-4 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Accept
                        </button>
                      )}
                      {suggestion.accepted && (
                        <div className="ml-4 flex items-center gap-1 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm">Accepted</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Document Analysis Results</h3>
              {analysisResults ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{analysisResults.summary.totalDocuments}</div>
                      <div className="text-sm text-blue-800">Total Documents</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{analysisResults.summary.screenedDocuments}</div>
                      <div className="text-sm text-green-800">Screened</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{analysisResults.summary.dataQualityScore}%</div>
                      <div className="text-sm text-purple-800">Data Quality</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">{analysisResults.summary.completenessScore}%</div>
                      <div className="text-sm text-yellow-800">Completeness</div>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Key Findings</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• 78% of studies used randomized controlled trials</li>
                        <li>• Most studies published between 2018-2022</li>
                        <li>• 5 studies need quality assessment completion</li>
                        <li>• Data extraction is 85% complete</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Complete quality assessment for remaining studies</li>
                        <li>• Consider additional search terms for better coverage</li>
                        <li>• Verify sample size data for 3 studies</li>
                        <li>• Extract adverse events data for safety analysis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No analysis results yet</p>
        <p className="text-sm">Click &quot;Analyze Documents&quot; to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
