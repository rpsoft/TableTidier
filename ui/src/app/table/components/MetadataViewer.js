"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';

const MetadataViewer = ({ annotations }) => {
  const [relatedConcepts, setRelatedConcepts] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const findRelatedConcepts = async () => {
    setIsLoading(true);
    const loadingToast = toast.loading('Finding related concepts...');

    const allConcepts = annotations.flatMap(annotation =>
      Object.values(annotation.concepts || {}).map(concept => concept.content)
    );
    const uniqueConcepts = [...new Set(allConcepts)];

    try {
      const response = await fetch('/api/find-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: uniqueConcepts }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setRelatedConcepts(data.results);
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
        {annotations.map((annotation, index) => {
          const conceptContents = Object.values(annotation.concepts || {}).map(
            (concept) => concept.content
          );
          const uniqueConceptContents = [...new Set(conceptContents)];

          return (
            <div key={index} className="p-3 bg-gray-700 rounded-md">
              <h3 className="text-xl font-semibold text-cyan-400">{annotation.category}</h3>
              {uniqueConceptContents.length > 0 ? (
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  {uniqueConceptContents.map((content, cIndex) => (
                    <li key={cIndex} className="text-base">
                      {content}
                      {relatedConcepts[content] && (
                        <ul className="list-decimal pl-6 mt-1 text-sm text-gray-300">
                          {relatedConcepts[content].map((related, rIndex) => (
                            <li key={rIndex}>
                              {related.text} (CUI: {related.cui}, Score: {related.score.toFixed(4)})
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
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