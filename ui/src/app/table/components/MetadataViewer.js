"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Select, Modal, Input, List, Button } from 'antd';
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
  const [modalState, setModalState] = useState({
    visible: false,
    targetTerm: null,
    searchTerm: '',
    results: [],
    isLoading: false,
  });

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
  };

  const openCuiSearchModal = (targetTerm) => {
    setModalState({
      visible: true,
      targetTerm,
      searchTerm: '',
      results: [],
      isLoading: false,
    });
  };

  const closeCuiSearchModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  const handleCuiSearch = async () => {
    if (!modalState.searchTerm) return;
    setModalState(prev => ({ ...prev, isLoading: true, results: [] }));

    const termsMap = { [modalState.searchTerm]: generateSubstrings(modalState.searchTerm) };

    try {
      const response = await fetch('/api/find-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_map: termsMap }),
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setModalState(prev => ({ ...prev, results: data.results[modalState.searchTerm] || [], isLoading: false }));
    } catch (error) {
      console.error('Failed to search for CUIs:', error);
      toast.error('Could not fetch custom CUIs.');
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const handleCuiSelection = (newConcept) => {
    const { targetTerm } = modalState;
    if (!targetTerm) return;

    const currentMapping = metadataMappings[targetTerm] || { availableOptions: [], selectedCuis: [] };

    // Add to available options (de-duplicated)
    const newAvailableOptions = [...currentMapping.availableOptions];
    if (!newAvailableOptions.some(opt => opt.cui === newConcept.cui)) {
      newAvailableOptions.push(newConcept);
    }

    // Add to selected CUIs (de-duplicated using a Set)
    const newSelectedCuis = [...new Set([...currentMapping.selectedCuis, newConcept.cui])];

    const newMappings = {
      ...metadataMappings,
      [targetTerm]: {
        availableOptions: newAvailableOptions,
        selectedCuis: newSelectedCuis,
      },
    };
    setValue('metadataMappings', newMappings);
    
    toast.success(`Added "${newConcept.text}" to selection.`);
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
                            const uniqueOptions = mapping.availableOptions || [];
                            return (
                              <Select
                                mode="multiple"
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Select representative concepts..."
                                value={mapping.selectedCuis || []}
                                onChange={(selectedCuis) => handleSelectionChange(content, selectedCuis)}
                                tagRender={(props) => {
                                  const { value, closable, onClose } = props;
                                  const option = uniqueOptions.find(opt => opt.cui === value);
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
                                options={uniqueOptions.map(related => {
                                  const isSelected = mapping.selectedCuis?.includes(related.cui);
                                  return {
                                    value: related.cui,
                                    label: <span className={isSelected ? 'text-black font-semibold' : 'text-white'}>{`${related.text} (Source: ${related.source}, Score: ${related.score.toFixed(4)}, Found by: "${related.found_by}")`}</span>
                                  };
                                })}
                                loading={isLoading && !mapping}
                                dropdownStyle={{ backgroundColor: '#1f2937' }}
                                className="custom-select-dropdown"
                              />
                            );
                          })()}
                        </div>
                        <a 
                          onClick={() => openCuiSearchModal(content)} 
                          className="text-cyan-400 hover:text-cyan-300 cursor-pointer text-sm flex-shrink-0 whitespace-nowrap"
                        >
                          Can't find the right CUI?
                        </a>
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

      <Modal
        title={`Find a CUI for "${modalState.targetTerm}"`}
        visible={modalState.visible}
        onCancel={closeCuiSearchModal}
        footer={[
          <Button key="close" onClick={closeCuiSearchModal}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <p className="mb-4">Enter a search term to find related concepts. Press Enter to search.</p>
        <Input
          placeholder="e.g., 'blood pressure measurement'"
          value={modalState.searchTerm}
          onChange={e => setModalState(prev => ({ ...prev, searchTerm: e.target.value }))}
          onPressEnter={handleCuiSearch}
          disabled={modalState.isLoading}
        />
        <List
          className="mt-4"
          loading={modalState.isLoading}
          dataSource={modalState.results}
          renderItem={item => (
            <List.Item
              actions={[<Button onClick={() => handleCuiSelection(item)}>Add</Button>]}
            >
              <List.Item.Meta
                title={item.text}
                description={`(Source: ${item.source}, CUI: ${item.cui}, Score: ${item.score.toFixed(4)}) - Found by: "${item.found_by}"`}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No results. Try a different search term.' }}
        />
      </Modal>
    </div>
  );
};

export default MetadataViewer; 