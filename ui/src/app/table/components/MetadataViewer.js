"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Select } from 'antd';
import { useTableContext } from '../TableContext';

const generateSubstrings = (text) => {
  const cleanedText = text.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanedText.split(' ').filter(w => w);
  if (words.length === 0) return [];
  
  const unigrams = words;
  const bigrams = [];
  if (words.length > 1) {
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i+1]}`);
    }
  }
  return [...new Set([...unigrams, ...bigrams])];
};

const MetadataViewer = ({ annotations }) => {
  const { state, setValue } = useTableContext();
  const { metadataMappings } = state;
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState({});

  const findRelatedConcepts = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Finding related concepts...');

    const allConcepts = annotations.flatMap(annotation =>
      Object.values(annotation.concepts || {}).map(concept => concept.content)
    );
    const uniqueConcepts = [...new Set(allConcepts)];

    const termsMap = uniqueConcepts.reduce((acc, concept) => {
      acc[concept] = generateSubstrings(concept);
      return acc;
    }, {});

    try {
      const response = await fetch('/api/find-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_map: termsMap }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const newMappings = {};
      for (const term in data.results) {
        newMappings[term] = {
          // All concepts returned from the search are the available options
          availableOptions: data.results[term] || [], 
          // Selections start empty
          selectedCuis: [], 
        };
      }

      setValue('metadataMappings', newMappings); // Overwrite mappings with fresh search results
      toast.dismiss(loadingToast);
      toast.success('Successfully found related concepts!');
    } catch (error) {
      console.error('Failed to fetch related concepts:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to find related concepts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (originalTerm, selectedCuis) => {
    const newMappings = {
      ...metadataMappings,
      [originalTerm]: {
        ...(metadataMappings[originalTerm] || { availableOptions: [], selectedCuis: [] }),
        // The `value` from AntD Select `multiple` mode is already de-duplicated
        selectedCuis: selectedCuis,
      },
    };
    setValue('metadataMappings', newMappings);
    // After selection, clear the search text for that specific input
    setCurrentSearch(prev => ({ ...prev, [originalTerm]: '' }));
  };

  const handleFreeTextSearch = async (event, originalTerm) => {
    const searchTerm = currentSearch[originalTerm];
    if (event.key !== 'Enter' || !searchTerm) return;
    
    event.preventDefault();
    toast.loading(`Searching for "${searchTerm}"...`);
    
    const termsMap = { [searchTerm]: generateSubstrings(searchTerm) };

    try {
      const response = await fetch('/api/find-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_map: termsMap }),
      });
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const newOptions = data.results[searchTerm] || [];
      toast.dismiss();

      if (newOptions.length === 0) {
        toast.error('No new concepts found.');
        return;
      }

      const currentMapping = metadataMappings[originalTerm] || { availableOptions: [], selectedCuis: [] };
      const combinedOptions = [...currentMapping.availableOptions, ...newOptions];
      
      const uniqueOptions = Object.values(combinedOptions.reduce((acc, cur) => {
        if (cur && cur.cui) acc[cur.cui] = cur;
        return acc;
      }, {}));

      const newMappings = {
        ...metadataMappings,
        [originalTerm]: {
          ...currentMapping,
          availableOptions: uniqueOptions,
        },
      };
      setValue('metadataMappings', newMappings);
      toast.success(`Added ${newOptions.length} new options.`);

    } catch (error) {
      console.error('Failed to search for concepts:', error);
      toast.dismiss();
      toast.error('Could not fetch search results.');
    }
  };

  if (!annotations || annotations.length === 0) {
    return (
      <div className="text-center text-gray-300 p-10">
        <h2 className="text-xl font-semibold mb-4">No Metadata Available</h2>
        <p className="text-sm">No concept groups have been defined for this table yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
        <h2 className="text-2xl font-bold">Concept Groups</h2>
        <button
          onClick={findRelatedConcepts}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Finding...' : 'Find Related Concepts'}
        </button>
      </div>
      <div className="space-y-4">
        {annotations.map((annotation) => {
          const conceptContents = Object.values(annotation.concepts || {}).map(
            (concept) => concept.content
          );
          const uniqueConceptContents = [...new Set(conceptContents)];

          return (
            <div key={annotation.id || annotation.category} className="p-3 bg-gray-700 rounded-md">
              <h3 className="text-xl font-semibold text-cyan-400">{annotation.category}</h3>
              {uniqueConceptContents.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {uniqueConceptContents.map((content) => {
                    const mapping = metadataMappings[content];
                    return (
                      <div key={content} className="flex items-center gap-4">
                        <p className="flex-shrink-0 font-semibold">{content}</p>
                        <div className="flex-grow">
                          {mapping && (() => {
                            const allAvailableOptions = mapping.availableOptions || [];
                            
                            return (
                              <Select
                                mode="multiple"
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Type to filter or search and press Enter..."
                                value={mapping.selectedCuis || []}
                                onSearch={(value) => setCurrentSearch(prev => ({ ...prev, [content]: value }))}
                                onInputKeyDown={(e) => handleFreeTextSearch(e, content)}
                                searchValue={currentSearch[content] || ''}
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={(selectedCuis) => handleSelectionChange(content, selectedCuis)}
                                tagRender={(props) => {
                                  const { value, closable, onClose } = props;
                                  const option = allAvailableOptions.find(opt => opt.cui === value);
                                  const onPreventMouseDown = (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                  };
                                  return (
                                    <span
                                      onMouseDown={onPreventMouseDown}
                                      onClick={onClose}
                                      className="ant-select-selection-item"
                                      style={{ color: 'black', background: '#f0f0f0', border: '1px solid #e8e8e8', borderRadius: '4px', padding: '0 4px', marginRight: '4px' }}
                                    >
                                      {option ? option.text : value}
                                      {closable && <span className="ant-select-selection-item-remove" onClick={onClose}>×</span>}
                                    </span>
                                  );
                                }}
                                options={allAvailableOptions.map(related => {
                                  const isSelected = mapping.selectedCuis?.includes(related.cui);
                                  const labelText = `${related.text} (Source: ${related.source}, Score: ${related.score.toFixed(4)}, Found by: "${related.found_by}")`;
                                  return {
                                    value: related.cui,
                                    label: labelText,
                                    renderedLabel: <span className={isSelected ? 'text-black font-semibold' : 'text-white'}>{labelText}</span>
                                  };
                                })}
                                optionRender={(option) => option.data.renderedLabel}
                                loading={isLoading && !mapping}
                                dropdownStyle={{ backgroundColor: '#1f2937' }}
                                className="custom-select-dropdown"
                                tokenSeparators={[',']}
                                dropdownRender={(menu) => (
                                  <div style={{ backgroundColor: '#1f2937' }}>
                                    {menu}
                                  </div>
                                )}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 italic mt-2">No concepts in this group.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetadataViewer; 