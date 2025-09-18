import { useState, useCallback } from 'react';

export function useDataPersistence(projectId) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);

  const saveData = useCallback(async (data, type) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, type })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      
      if (result.success) {
        setLastSaved(new Date().toISOString());
        return result.data;
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  const saveProject = useCallback((projectData) => {
    return saveData(projectData, 'project');
  }, [saveData]);

  const saveDocument = useCallback((documentData) => {
    return saveData(documentData, 'document');
  }, [saveData]);

  const saveScreening = useCallback((documentId, screeningData) => {
    return saveData({ docId: documentId, screeningData }, 'screening');
  }, [saveData]);

  const saveExtraction = useCallback((documentId, extractedData) => {
    return saveData({ documentId, extractedData }, 'extraction');
  }, [saveData]);

  const saveQualityAssessment = useCallback((documentId, qualityAssessment) => {
    return saveData({ documentId, qualityAssessment }, 'quality_assessment');
  }, [saveData]);

  return {
    isSaving,
    lastSaved,
    error,
    saveData,
    saveProject,
    saveDocument,
    saveScreening,
    saveExtraction,
    saveQualityAssessment
  };
}
