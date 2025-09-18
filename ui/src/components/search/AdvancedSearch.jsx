'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  BookOpen
} from 'lucide-react';

export default function AdvancedSearch({ documents, onResults, onSaveSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    title: '',
    authors: '',
    journal: '',
    yearFrom: '',
    yearTo: '',
    keywords: [],
    screeningStatus: 'all',
    hasTables: false,
    hasExtractedData: false,
    dateRange: {
      from: '',
      to: ''
    }
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    performSearch();
  }, [searchQuery, filters]);

  const performSearch = () => {
    let filteredDocs = [...documents];

    // Text search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter(doc => {
        const title = doc.metadata?.title?.toLowerCase() || '';
        const authors = doc.metadata?.authors?.join(' ').toLowerCase() || '';
        const abstract = doc.metadata?.abstract?.toLowerCase() || '';
        const journal = doc.metadata?.journal?.toLowerCase() || '';
        const keywords = doc.metadata?.keywords?.join(' ').toLowerCase() || '';
        
        return title.includes(query) || 
               authors.includes(query) || 
               abstract.includes(query) || 
               journal.includes(query) || 
               keywords.includes(query);
      });
    }

    // Apply filters
    if (filters.title) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata?.title?.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.authors) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata?.authors?.some(author => 
          author.toLowerCase().includes(filters.authors.toLowerCase())
        )
      );
    }

    if (filters.journal) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata?.journal?.toLowerCase().includes(filters.journal.toLowerCase())
      );
    }

    if (filters.yearFrom) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata?.year >= parseInt(filters.yearFrom)
      );
    }

    if (filters.yearTo) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.metadata?.year <= parseInt(filters.yearTo)
      );
    }

    if (filters.keywords.length > 0) {
      filteredDocs = filteredDocs.filter(doc => 
        filters.keywords.some(keyword => 
          doc.metadata?.keywords?.some(docKeyword => 
            docKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );
    }

    if (filters.screeningStatus !== 'all') {
      filteredDocs = filteredDocs.filter(doc => {
        const latestScreening = doc.screening?.[doc.screening.length - 1];
        const decision = latestScreening?.decision || 'pending';
        return decision === filters.screeningStatus;
      });
    }

    if (filters.hasTables) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.tables && doc.tables.length > 0
      );
    }

    if (filters.hasExtractedData) {
      filteredDocs = filteredDocs.filter(doc => 
        doc.extractedData && doc.extractedData.length > 0
      );
    }

    if (filters.dateRange.from) {
      filteredDocs = filteredDocs.filter(doc => 
        new Date(doc.createdAt) >= new Date(filters.dateRange.from)
      );
    }

    if (filters.dateRange.to) {
      filteredDocs = filteredDocs.filter(doc => 
        new Date(doc.createdAt) <= new Date(filters.dateRange.to)
      );
    }

    setResults(filteredDocs);
    onResults(filteredDocs);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleKeywordAdd = (keyword) => {
    if (keyword.trim() && !filters.keywords.includes(keyword.trim())) {
      setFilters(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  const handleKeywordRemove = (keyword) => {
    setFilters(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };


  const getScreeningStatusColor = (decision) => {
    switch (decision) {
      case 'included': return 'text-green-600 bg-green-100';
      case 'excluded': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      title: '',
      authors: '',
      journal: '',
      yearFrom: '',
      yearTo: '',
      keywords: [],
      screeningStatus: 'all',
      hasTables: false,
      hasExtractedData: false,
      dateRange: {
        from: '',
        to: ''
      }
    });
  };

  const saveSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (searchName) {
      const newSearch = {
        id: Date.now().toString(),
        name: searchName,
        query: searchQuery,
        filters: filters,
        timestamp: new Date().toISOString()
      };
      setSavedSearches(prev => [...prev, newSearch]);
      onSaveSearch?.(newSearch);
    }
  };

  const loadSearch = (search) => {
    setSearchQuery(search.query);
    setFilters(search.filters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Search size={20} />
          Advanced Search
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter size={16} />
            {showAdvanced ? 'Hide' : 'Show'} Filters
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search across titles, authors, abstracts, journals, and keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                placeholder="Filter by title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Authors Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authors
              </label>
              <input
                type="text"
                value={filters.authors}
                onChange={(e) => handleFilterChange('authors', e.target.value)}
                placeholder="Filter by author..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Journal Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Journal
              </label>
              <input
                type="text"
                value={filters.journal}
                onChange={(e) => handleFilterChange('journal', e.target.value)}
                placeholder="Filter by journal..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year From
              </label>
              <input
                type="number"
                value={filters.yearFrom}
                onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                placeholder="1990"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year To
              </label>
              <input
                type="number"
                value={filters.yearTo}
                onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Screening Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screening Status
              </label>
              <select
                value={filters.screeningStatus}
                onChange={(e) => handleFilterChange('screeningStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="included">Included</option>
                <option value="excluded">Excluded</option>
              </select>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {filters.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {keyword}
                  <button
                    onClick={() => handleKeywordRemove(keyword)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add keyword and press Enter..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleKeywordAdd(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Boolean Filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasTables}
                onChange={(e) => handleFilterChange('hasTables', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Has Tables</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasExtractedData}
                onChange={(e) => handleFilterChange('hasExtractedData', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Has Extracted Data</span>
            </label>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Found <span className="font-medium text-gray-900">{results.length}</span> documents
          {documents.length > 0 && (
            <span className="text-gray-500">
              {' '}out of {documents.length} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveSearch}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <Save size={16} />
            Save Search
          </button>
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Saved Searches</h3>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((search) => (
              <button
                key={search.id}
                onClick={() => loadSearch(search)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <BookOpen size={12} />
                {search.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
