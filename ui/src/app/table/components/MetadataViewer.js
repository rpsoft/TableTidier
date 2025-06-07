"use client";

import React from 'react';

const MetadataViewer = ({ annotations }) => {
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
      <h2 className="text-2xl font-bold mb-4 border-b border-gray-600 pb-2">Concept Groups</h2>
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
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  {uniqueConceptContents.map((content, cIndex) => (
                    <li key={cIndex} className="text-base">
                      {content}
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