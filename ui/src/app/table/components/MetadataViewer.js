"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Select } from 'antd';
import { useTableContext } from '../TableContext';

const generateSubstrings = (text) => {
  const cleanedText = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanedText.split(' ').filter(w => w);
  if (words.length === 0) return [];
  
  const unigrams = words;
  const bigrams = [];
  if (words.length > 1) {
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i+1]}`);
    }
  }
  return [...new Set([cleanedText, ...unigrams, ...bigrams])];
};

const MetadataViewer = () => {
  const { state, setValue } = useTableContext();
  const { annotations, metadataMappings } = state;

  const [isLoading, setIsLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState({});
  const [lastSelectedOption, setLastSelectedOption] = useState(null);

  const handleDownloadMetadata = () => {
    if (!metadataMappings) {
      toast.error("No metadata to download.");
      return;
    }

    const filteredMappings = Object.entries(metadataMappings).reduce((acc, [key, value]) => {
      acc[key] = { selectedCuis: value.selectedCuis };
      return acc;
    }, {});

    const jsonString = JSON.stringify(filteredMappings, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "metadata.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const findRelatedConcepts = async () => {
    setIsLoading(true);
    try {
      const allConceptContents = annotations.flatMap(annotation =>
        Object.values(annotation.concepts || {}).map(concept => concept.content)
      );
      const uniqueConceptContents = [...new Set(allConceptContents)]
        .map(content => content.replace(/[^a-zA-Z0-9\s]/g, '').trim())
        .filter(Boolean);

      if (uniqueConceptContents.length === 0) {
        toast.info("No concepts to find.");
        setIsLoading(false);
        return;
      }

      const terms_map = uniqueConceptContents.reduce((acc, content) => {
        acc[content] = generateSubstrings(content);
        return acc;
      }, {});

      const response = await fetch('/api/find-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms_map }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(`Error finding related concepts: ${data.error}`);
        setIsLoading(false);
        return;
      }
      
      if (!data.results) {
        toast.info("No concepts found.");
        setIsLoading(false);
        return;
      }

      let newMappings = JSON.parse(JSON.stringify(metadataMappings || {}));

      for (const term in data.results) {
        const newOptions = data.results[term] || [];
        if (newOptions.length === 0) continue;

        const bestMatch = newOptions.find(opt => opt.isBestMatch);
        const currentMapping = newMappings[term] || { availableOptions: [], selectedCuis: [] };
        const combinedOptions = [...currentMapping.availableOptions, ...newOptions];
        const uniqueOptions = Array.from(new Set(combinedOptions.map(opt => opt.cui)))
          .map(cui => combinedOptions.find(opt => opt.cui === cui));

        newMappings[term] = {
          ...currentMapping,
          availableOptions: uniqueOptions,
          selectedCuis: bestMatch ? [...new Set([...currentMapping.selectedCuis, bestMatch.cui])] : currentMapping.selectedCuis,
        };
      }

      setValue('metadataMappings', newMappings);
      toast.success("Found and updated related concepts.");

    } catch (error) {
      console.error('Failed to fetch related concepts:', error);
      toast.error('Failed to fetch related concepts.');
    } finally {
      setIsLoading(false);
    }
  };

  const findConceptsForTerm = async (cleanedContent) => {
    setIsLoading(true);
    try {
      const substrings = generateSubstrings(cleanedContent);
      const terms_map = { [cleanedContent]: substrings };

      const response = await fetch(`/api/find-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ terms_map }),
      });
      const data = await response.json();

      if (data.error) {
        toast.error(`Error finding concepts: ${data.error}`);
        setIsLoading(false);
        return;
      }

      const newOptions = (data.results && data.results[cleanedContent]) ? data.results[cleanedContent] : [];
      const bestMatch = newOptions.find(opt => opt.isBestMatch);

      const newMappings = JSON.parse(JSON.stringify(metadataMappings || {}));
      const currentMapping = newMappings[cleanedContent] || { availableOptions: [], selectedCuis: [] };
      
      const combinedOptions = [...currentMapping.availableOptions, ...newOptions];
      const uniqueOptions = Array.from(new Set(combinedOptions.map(opt => opt.cui)))
        .map(cui => combinedOptions.find(opt => opt.cui === cui));

      newMappings[cleanedContent] = {
        ...currentMapping,
        availableOptions: uniqueOptions,
        selectedCuis: bestMatch ? [...new Set([...currentMapping.selectedCuis, bestMatch.cui])] : currentMapping.selectedCuis,
      };

      setValue('metadataMappings', newMappings);
    } catch (error) {
      console.error('Failed to fetch related concepts:', error);
      toast.error('Failed to fetch related concepts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (cleanedContent, selectedValues) => {
    const normalizedCuis = [...new Set(selectedValues.map(val =>
      val.startsWith('last_used_') ? val.substring('last_used_'.length) : val
    ))];

    const newMappings = JSON.parse(JSON.stringify(metadataMappings || {}));

    if (!newMappings[cleanedContent]) {
      newMappings[cleanedContent] = { availableOptions: [], selectedCuis: [] };
    }
    newMappings[cleanedContent].selectedCuis = normalizedCuis;

    const lastSelectedCui = normalizedCuis[normalizedCuis.length - 1];
    if (lastSelectedCui) {
      let foundOption = null;
      for (const key in newMappings) {
        const mapping = newMappings[key];
        if (mapping && mapping.availableOptions) {
          const found = mapping.availableOptions.find(opt => opt.cui === lastSelectedCui);
          if (found) {
            foundOption = found;
            break;
          }
        }
      }

      if (foundOption) {
        const cleanOption = { ...foundOption, value: foundOption.cui };
        delete cleanOption.isLastUsed;

        setLastSelectedOption(cleanOption);
      }
    }
    setValue('metadataMappings', newMappings);
  };

  const handleFreeTextSearch = async (event, cleanedContent) => {
    const searchTerm = currentSearch[cleanedContent];
    if (event.key !== 'Enter' || !searchTerm) return;
    
    setIsLoading(true);
    try {
      const substrings = generateSubstrings(searchTerm);
      const terms_map = { [searchTerm]: substrings };
      const response = await fetch(`/api/find-concepts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ terms_map }),
      });
      const data = await response.json();

      if (data.error) {
        toast.error(`Error finding concepts: ${data.error}`);
        return;
      }

      const newOptions = (data.results && data.results[searchTerm]) ? data.results[searchTerm] : [];
      const bestMatch = newOptions.find(opt => opt.isBestMatch);

      const newMappings = JSON.parse(JSON.stringify(metadataMappings || {}));
      const currentMapping = newMappings[cleanedContent] || { availableOptions: [], selectedCuis: [] };
      const combinedOptions = [...currentMapping.availableOptions, ...newOptions];
      
      const uniqueOptions = Array.from(new Set(combinedOptions.map(opt => opt.cui)))
        .map(cui => combinedOptions.find(opt => opt.cui === cui));

      newMappings[cleanedContent] = {
        ...currentMapping,
        availableOptions: uniqueOptions,
        selectedCuis: bestMatch ? [...new Set([...currentMapping.selectedCuis, bestMatch.cui])] : currentMapping.selectedCuis,
      };

      setValue('metadataMappings', newMappings);
      setCurrentSearch(prev => ({ ...prev, [cleanedContent]: '' }));
    } catch (error) {
      toast.error("An error occurred while searching for concepts.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!annotations || annotations.length === 0) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
        <p>No annotations available to display metadata for.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
        <h2 className="text-2xl font-bold">Concept Groups</h2>
        <div className="flex gap-2">
          <button
            onClick={findRelatedConcepts}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Finding...' : 'Find Related Concepts'}
          </button>
          <button
            onClick={handleDownloadMetadata}
            className="btn btn-secondary"
          >
            Download Metadata
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {annotations.map((annotation, annotationIndex) => {
          const conceptContents = Object.values(annotation.concepts || {}).map(
            (concept) => concept.content
          );
          const uniqueConceptContents = [...new Set(conceptContents)];

          return (
            <div key={annotationIndex + "_" + (annotation.id || annotation.category)} className="p-3 bg-gray-700 rounded-md">
              <h3 className="text-xl font-semibold text-cyan-400">{annotation.category}</h3>
              {uniqueConceptContents.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {uniqueConceptContents.map((content, contentIndex) => {
                    const cleanedContent = content.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                    if (!cleanedContent) return null;
                    
                    const mapping = metadataMappings[cleanedContent];
                     return (
                      <div key={contentIndex+"_"+cleanedContent} className="flex items-center gap-4">
                        <p className="flex-shrink-0 font-semibold">{content}</p>
                        <div className="flex-grow">
                          {mapping && (() => {
                            const allAvailableOptions = (mapping.availableOptions || []).sort((a, b) => 
                              a.cui.localeCompare(b.cui)
                            );
                            
                            let optionsForRender = allAvailableOptions.map(opt => ({ ...opt, value: opt.cui }));
                            let hasLastSelected = false;

                            if (lastSelectedOption) {
                              const isSelectedInCurrent = (mapping.selectedCuis || []).includes(lastSelectedOption.cui);

                              if (!isSelectedInCurrent) {
                                hasLastSelected = true;
                                const lastUsedDisplayOption = {
                                  ...lastSelectedOption,
                                  value: `last_used_${lastSelectedOption.cui}`,
                                  isLastUsed: true,
                                };

                                optionsForRender = optionsForRender.filter(opt => opt.cui !== lastSelectedOption.cui);
                                optionsForRender.unshift(lastUsedDisplayOption);
                              }
                            }

                            return (
                              <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                placeholder="Type to filter or search and press Enter..."
                                value={mapping.selectedCuis || []}
                                onSearch={(value) => setCurrentSearch(prev => ({ ...prev, [cleanedContent]: value }))}
                                onInputKeyDown={(e) => handleFreeTextSearch(e, cleanedContent)}
                                searchValue={currentSearch[cleanedContent] || ''}
                                filterOption={(input, option) =>
                                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={(selectedCuis) => handleSelectionChange(cleanedContent, selectedCuis)}
                                tagRender={(props) => {
                                  const { value, closable, onClose } = props;
                                  let option = allAvailableOptions.find(opt => opt.cui === value);
                                  if (!option && lastSelectedOption && lastSelectedOption.cui === value) {
                                    option = lastSelectedOption;
                                  }

                                  const handleClose = (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClose(e);
                                  };

                                  return (
                                    <span
                                      className="ant-tag-custom"
                                      style={{
                                        margin: '2px',
                                        padding: '2px 6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        border:'solid 1px #e8e8e8',
                                        borderRadius:'10px',
                                      }}
                                    >
                                      {option ? `${option.text} (${option.cui})` : value}
                                      {closable && <span className="ant-select-selection-item-remove" onMouseDown={handleClose} style={{ fontSize: '14px', marginLeft: '8px', cursor: 'pointer' }}>×</span>}
                                    </span>
                                  );
                                }}
                                options={optionsForRender.map(related => {
                                  const isSelected = mapping.selectedCuis?.includes(related.cui);
                                  let labelText = `${related.text} (CUI: ${related.cui}, Source: ${related.source}, Score: ${related.score.toFixed(4)}, Found by: "${related.found_by}")`;
                                  if (related.isLastUsed) {
                                    labelText = `(Last Used) ${labelText}`;
                                  }
                                  return {
                                    value: related.value,
                                    label: labelText,
                                    renderedLabel: <span className={isSelected ? 'text-black font-semibold' : 'text-white'}>{labelText}</span>
                                  };
                                })}
                                optionRender={(option) => option.data.renderedLabel}
                                loading={isLoading && !mapping}
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ 
                                  backgroundColor: '#1f2937',
                                  width: 'auto',
                                  minWidth: '400px'
                                }}
                                className="custom-select-dropdown"
                                popupClassName="custom-scrollbar"
                                tokenSeparators={[',']}
                                dropdownRender={(menu) => (
                                  <div style={{ backgroundColor: '#1f2937' }}>
                                    {hasLastSelected && menu.props.children && Array.isArray(menu.props.children) && menu.props.children.length > 1 ? (
                                      <>
                                        {menu.props.children[0]}
                                        <hr className="my-1 border-gray-600" />
                                        {menu.props.children.slice(1)}
                                      </>
                                    ) : (
                                      menu
                                    )}
                                  </div>
                                )}
                              />
                            );
                          })()}
                          {!mapping && (
                             <button
                              onClick={() => findConceptsForTerm(cleanedContent)}
                              className="btn btn-sm btn-primary"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Finding...' : 'Find Concepts'}
                            </button>
                          )}
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