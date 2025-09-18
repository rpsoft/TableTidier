'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  FileText, 
  Table,
  Tag,
  Database,
  Download
} from 'lucide-react';

export default function DataExtractionInterface({ document, project, onSave }) {
  const [extractedData, setExtractedData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newVariable, setNewVariable] = useState({
    variable: '',
    value: '',
    source: {
      docId: document?.id,
      tableId: '',
      cell: [0, 0],
      textSpan: [0, 0]
    },
    ontologyMatch: {
      umlsId: '',
      conceptName: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined systematic review variables
  const predefinedVariables = [
    'Study ID',
    'First Author',
    'Year of Publication',
    'Country',
    'Study Design',
    'Sample Size',
    'Age Range',
    'Gender Distribution',
    'Intervention Type',
    'Control Type',
    'Primary Outcome',
    'Secondary Outcomes',
    'Follow-up Period',
    'Statistical Methods',
    'Key Findings',
    'Limitations',
    'Risk of Bias',
    'Quality Score'
  ];

  useEffect(() => {
    if (document?.extractedData) {
      setExtractedData(document.extractedData);
    }
  }, [document]);

  const handleAddVariable = () => {
    if (newVariable.variable.trim() && newVariable.value.trim()) {
      const variable = {
        ...newVariable,
        id: Date.now().toString(),
        extractedBy: 'current-user', // This should come from session
        extractedAt: new Date().toISOString()
      };
      
      setExtractedData(prev => [...prev, variable]);
      setNewVariable({
        variable: '',
        value: '',
        source: {
          docId: document?.id,
          tableId: '',
          cell: [0, 0],
          textSpan: [0, 0]
        },
        ontologyMatch: {
          umlsId: '',
          conceptName: ''
        }
      });
    }
  };

  const handleEditVariable = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index, updatedVariable) => {
    setExtractedData(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updatedVariable } : item
    ));
    setEditingIndex(null);
  };

  const handleDeleteVariable = (index) => {
    setExtractedData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    setIsSubmitting(true);
    try {
      await onSave(document.id, extractedData);
    } catch (error) {
      console.error('Error saving extracted data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePredefinedVariableSelect = (variable) => {
    setNewVariable(prev => ({ ...prev, variable }));
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Variable', 'Value', 'Source Table', 'Source Cell', 'UMLS ID', 'Concept Name'],
      ...extractedData.map(item => [
        item.variable,
        item.value,
        item.source.tableId || '',
        `[${item.source.cell.join(',')}]`,
        item.ontologyMatch.umlsId || '',
        item.ontologyMatch.conceptName || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-data-${document?.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Extraction</h1>
            <p className="text-gray-600 mt-1">
              Extract systematic review variables from: {document?.metadata?.title || 'Document'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handleSaveAll}
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
                  Save All
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Tables */}
          {document?.tables && document.tables.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Table size={20} />
                Document Tables
              </h2>
              <div className="space-y-4">
                {document.tables.map((table, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Table {index + 1}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            {table.headers?.[0]?.map((header, i) => (
                              <th key={i} className="px-3 py-2 text-left font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows?.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-gray-200">
                              {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2 text-gray-900">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {table.rows?.length > 5 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... and {table.rows.length - 5} more rows
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Text */}
          {document?.text && document.text.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Document Text
              </h2>
              <div className="space-y-4">
                {document.text.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2 capitalize">
                      {section.section}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Extraction Panel */}
        <div className="space-y-6">
          {/* Add New Variable */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={20} />
              Add Variable
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={newVariable.variable}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, variable: e.target.value }))}
                  placeholder="Enter variable name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {/* Predefined Variables */}
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Common variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {predefinedVariables.slice(0, 6).map((variable) => (
                      <button
                        key={variable}
                        onClick={() => handlePredefinedVariableSelect(variable)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <textarea
                  value={newVariable.value}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter extracted value..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Table
                  </label>
                  <input
                    type="text"
                    value={newVariable.source.tableId}
                    onChange={(e) => setNewVariable(prev => ({ 
                      ...prev, 
                      source: { ...prev.source, tableId: e.target.value }
                    }))}
                    placeholder="Table ID"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cell Position
                  </label>
                  <input
                    type="text"
                    value={`[${newVariable.source.cell.join(',')}]`}
                    onChange={(e) => {
                      const cellStr = e.target.value.replace(/[\[\]]/g, '');
                      const cell = cellStr.split(',').map(Number);
                      if (cell.length === 2 && !isNaN(cell[0]) && !isNaN(cell[1])) {
                        setNewVariable(prev => ({ 
                          ...prev, 
                          source: { ...prev.source, cell }
                        }));
                      }
                    }}
                    placeholder="[row, col]"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UMLS ID
                  </label>
                  <input
                    type="text"
                    value={newVariable.ontologyMatch.umlsId}
                    onChange={(e) => setNewVariable(prev => ({ 
                      ...prev, 
                      ontologyMatch: { ...prev.ontologyMatch, umlsId: e.target.value }
                    }))}
                    placeholder="C1234567"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concept Name
                  </label>
                  <input
                    type="text"
                    value={newVariable.ontologyMatch.conceptName}
                    onChange={(e) => setNewVariable(prev => ({ 
                      ...prev, 
                      ontologyMatch: { ...prev.ontologyMatch, conceptName: e.target.value }
                    }))}
                    placeholder="Concept name"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleAddVariable}
                disabled={!newVariable.variable.trim() || !newVariable.value.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Variable
              </button>
            </div>
          </div>

          {/* Extracted Variables List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database size={20} />
              Extracted Variables ({extractedData.length})
            </h2>
            
            {extractedData.length === 0 ? (
              <div className="text-center py-8">
                <Database size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No variables extracted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {extractedData.map((item, index) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                    {editingIndex === index ? (
                      <EditVariableForm
                        variable={item}
                        onSave={(updated) => handleSaveEdit(index, updated)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.variable}</h3>
                            <p className="text-gray-700 mt-1">{item.value}</p>
                            {item.ontologyMatch.umlsId && (
                              <div className="flex items-center gap-2 mt-2">
                                <Tag size={14} className="text-blue-500" />
                                <span className="text-sm text-blue-600">
                                  {item.ontologyMatch.conceptName} ({item.ontologyMatch.umlsId})
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => handleEditVariable(index)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteVariable(index)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Source: {item.source.tableId ? `Table ${item.source.tableId}` : 'Text'} 
                          {item.source.cell && ` [${item.source.cell.join(',')}]`}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Variable Form Component
function EditVariableForm({ variable, onSave, onCancel }) {
  const [editedVariable, setEditedVariable] = useState(variable);

  const handleSave = () => {
    onSave(editedVariable);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Variable Name
        </label>
        <input
          type="text"
          value={editedVariable.variable}
          onChange={(e) => setEditedVariable(prev => ({ ...prev, variable: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Value
        </label>
        <textarea
          value={editedVariable.value}
          onChange={(e) => setEditedVariable(prev => ({ ...prev, value: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
        >
          <Check size={14} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
}
