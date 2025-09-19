'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Database,
  Tag,
  Filter,
  Download,
  Upload,
  Settings,
  Brain,
  Zap
} from 'lucide-react';

export default function OntologyManager({ project, documents = [], onConceptMapping }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedConcepts, setSelectedConcepts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [mappedConcepts, setMappedConcepts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [ontologyStats, setOntologyStats] = useState({
    totalConcepts: 0,
    mappedConcepts: 0,
    unmappedConcepts: 0,
    coverage: 0
  });

  // Mock UMLS/MeSH API responses
  const mockSearchResults = [
    {
      id: 'C0000001',
      name: 'Neoplasms',
      definition: 'New abnormal growth of tissue. Malignant neoplasms show a greater degree of anaplasia and have the properties of invasion and metastasis.',
      semanticType: 'Neoplastic Process',
      synonyms: ['Tumors', 'Cancer', 'Malignancy'],
      cui: 'C0000001',
      source: 'MeSH',
      confidence: 0.95
    },
    {
      id: 'C0000002',
      name: 'Therapeutics',
      definition: 'Procedures concerned with the remedial treatment or prevention of diseases.',
      semanticType: 'Therapeutic or Preventive Procedure',
      synonyms: ['Treatment', 'Therapy', 'Medical Treatment'],
      cui: 'C0000002',
      source: 'MeSH',
      confidence: 0.88
    },
    {
      id: 'C0000003',
      name: 'Randomized Controlled Trials',
      definition: 'Clinical trials that involve at least one test treatment and one control treatment, concurrent enrollment and follow-up of the test- and control-treated groups.',
      semanticType: 'Research Activity',
      synonyms: ['RCT', 'Clinical Trial', 'Randomized Trial'],
      cui: 'C0000003',
      source: 'MeSH',
      confidence: 0.92
    }
  ];

  const mockSuggestions = [
    {
      concept: 'Efficacy',
      suggestions: [
        { id: 'C0000004', name: 'Treatment Outcome', confidence: 0.85 },
        { id: 'C0000005', name: 'Therapeutic Efficacy', confidence: 0.78 },
        { id: 'C0000006', name: 'Clinical Effectiveness', confidence: 0.72 }
      ]
    },
    {
      concept: 'Safety',
      suggestions: [
        { id: 'C0000007', name: 'Drug Safety', confidence: 0.90 },
        { id: 'C0000008', name: 'Adverse Effects', confidence: 0.87 },
        { id: 'C0000009', name: 'Toxicity', confidence: 0.75 }
      ]
    }
  ];

  useEffect(() => {
    // Load existing concept mappings
    loadMappedConcepts();
    // Load suggestions based on extracted data
    loadSuggestions();
  }, [project]);

  const loadMappedConcepts = () => {
    // In real implementation, this would load from the database
    const concepts = [
      {
        id: 'mapping1',
        originalText: 'cancer treatment',
        mappedConcept: {
          id: 'C0000001',
          name: 'Neoplasms',
          cui: 'C0000001',
          source: 'MeSH'
        },
        confidence: 0.95,
        mappedBy: 'Dr. Smith',
        mappedAt: new Date().toISOString()
      }
    ];
    setMappedConcepts(concepts);
    updateOntologyStats(concepts);
  };

  const loadSuggestions = async () => {
    try {
      // Extract concepts from project documents
      const allText = documents.map(doc => 
        `${doc.metadata?.title || ''} ${doc.metadata?.abstract || ''}`
      ).join(' ');

      if (allText.trim()) {
        const response = await fetch('/api/ontology/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: allText })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.concepts) {
            // Group concepts by type and create suggestions
            const conceptGroups = data.concepts.reduce((acc, concept) => {
              if (!acc[concept.type]) acc[concept.type] = [];
              acc[concept.type].push(concept);
              return acc;
            }, {});

            const aiSuggestions = Object.entries(conceptGroups).map(([type, concepts]) => ({
              concept: type,
              suggestions: concepts.slice(0, 3).map(c => ({
                id: c.concept.replace(/\s+/g, '_'),
                name: c.concept,
                confidence: c.confidence
              }))
            }));

            setSuggestions(aiSuggestions);
          }
        }
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions(mockSuggestions);
    }
  };

  const updateOntologyStats = (concepts) => {
    const total = concepts.length;
    const mapped = concepts.filter(c => c.mappedConcept).length;
    setOntologyStats({
      totalConcepts: total,
      mappedConcepts: mapped,
      unmappedConcepts: total - mapped,
      coverage: total > 0 ? Math.round((mapped / total) * 100) : 0
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/ontology/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          ontologyType: 'UMLS'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search ontology');
      }

      const data = await response.json();
      
      if (data.success && data.mapping) {
        // Convert AI response to our expected format
        const concept = {
          id: data.mapping.mappedConcept.id || `concept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.mapping.mappedConcept.name,
          definition: data.mapping.mappedConcept.definition || 'No definition available',
          semanticType: data.mapping.mappedConcept.semanticType || 'Unknown',
          synonyms: data.mapping.mappedConcept.synonyms || [],
          cui: data.mapping.mappedConcept.id,
          source: 'UMLS',
          confidence: data.mapping.mappedConcept.confidence || 0.8,
          reasoning: data.mapping.reasoning
        };
        
        setSearchResults([concept]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConceptSelect = (concept) => {
    setSelectedConcepts(prev => {
      const exists = prev.find(c => c.id === concept.id);
      if (exists) return prev;
      return [...prev, concept];
    });
  };

  const handleConceptRemove = (conceptId) => {
    setSelectedConcepts(prev => prev.filter(c => c.id !== conceptId));
  };

  const handleConceptMapping = (originalText, mappedConcept) => {
    const newMapping = {
      id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalText,
      mappedConcept,
      confidence: mappedConcept.confidence,
      mappedBy: 'Current User',
      mappedAt: new Date().toISOString()
    };
    
    setMappedConcepts(prev => [newMapping, ...prev]);
    updateOntologyStats([...mappedConcepts, newMapping]);
    onConceptMapping?.(newMapping);
  };

  const handleBulkMapping = () => {
    // Map all selected concepts
    selectedConcepts.forEach(concept => {
      handleConceptMapping(searchQuery, concept);
    });
    setSelectedConcepts([]);
    setSearchQuery('');
  };

  const handleSuggestionAccept = (concept, suggestion) => {
    handleConceptMapping(concept, suggestion);
  };

  const exportMappings = () => {
    const data = mappedConcepts.map(mapping => ({
      originalText: mapping.originalText,
      conceptId: mapping.mappedConcept.id,
      conceptName: mapping.mappedConcept.name,
      cui: mapping.mappedConcept.cui,
      source: mapping.mappedConcept.source,
      confidence: mapping.confidence,
      mappedBy: mapping.mappedBy,
      mappedAt: mapping.mappedAt
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ontology-mappings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain size={28} />
              Ontology Integration
            </h1>
            <p className="text-gray-600 mt-1">
              Map extracted concepts to standardized ontologies (UMLS, MeSH, SNOMED CT)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportMappings}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export Mappings
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Database className="text-blue-600" size={24} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Concepts</p>
              <p className="text-2xl font-semibold text-gray-900">{ontologyStats.totalConcepts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="text-green-600" size={24} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mapped</p>
              <p className="text-2xl font-semibold text-gray-900">{ontologyStats.mappedConcepts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertCircle className="text-yellow-600" size={24} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unmapped</p>
              <p className="text-2xl font-semibold text-gray-900">{ontologyStats.unmappedConcepts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Zap className="text-purple-600" size={24} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">{ontologyStats.coverage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'search', label: 'Search Ontology', icon: Search },
              { id: 'mappings', label: 'Concept Mappings', icon: Link },
              { id: 'suggestions', label: 'AI Suggestions', icon: Brain },
              { id: 'import', label: 'Import/Export', icon: Upload }
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
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Interface */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for concepts in UMLS, MeSH, SNOMED CT..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Search
                    </>
                  )}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                  {searchResults.map(concept => (
                    <div key={concept.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{concept.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(concept.confidence)}`}>
                              {Math.round(concept.confidence * 100)}% match
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {concept.source}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{concept.definition}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>CUI: {concept.cui}</span>
                            <span>Type: {concept.semanticType}</span>
                          </div>
                          {concept.synonyms.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 mb-1">Synonyms:</p>
                              <div className="flex flex-wrap gap-1">
                                {concept.synonyms.map((synonym, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {synonym}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleConceptSelect(concept)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Concepts */}
              {selectedConcepts.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Selected Concepts</h3>
                  <div className="space-y-2">
                    {selectedConcepts.map(concept => (
                      <div key={concept.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <span className="font-medium text-gray-900">{concept.name}</span>
                          <span className="ml-2 text-sm text-gray-500">({concept.source})</span>
                        </div>
                        <button
                          onClick={() => handleConceptRemove(concept.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleBulkMapping}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Map All Selected Concepts
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mappings' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Concept Mappings</h3>
              {mappedConcepts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Link size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>No concept mappings yet</p>
                  <p className="text-sm">Start by searching for concepts to map</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mappedConcepts.map(mapping => (
                    <div key={mapping.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-gray-900">{mapping.originalText}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-blue-600">{mapping.mappedConcept.name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(mapping.confidence)}`}>
                              {Math.round(mapping.confidence * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>CUI: {mapping.mappedConcept.cui}</span>
                            <span>Source: {mapping.mappedConcept.source}</span>
                            <span>Mapped by: {mapping.mappedBy}</span>
                            <span>Date: {new Date(mapping.mappedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button className="text-red-600 hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Suggestions</h3>
              <p className="text-gray-600">Based on your extracted data, here are suggested concept mappings:</p>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">For concept: &quot;{suggestion.concept}&quot;</h4>
                  <div className="space-y-2">
                    {suggestion.suggestions.map(concept => (
                      <div key={concept.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <span className="font-medium text-gray-900">{concept.name}</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getConfidenceColor(concept.confidence)}`}>
                            {Math.round(concept.confidence * 100)}% confidence
                          </span>
                        </div>
                        <button
                          onClick={() => handleSuggestionAccept(suggestion.concept, concept)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Concept Mappings</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Upload a CSV file with concept mappings</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Choose File
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Mappings</h3>
                <div className="flex gap-4">
                  <button
                    onClick={exportMappings}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Export as CSV
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
