'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ScreeningDashboard from '@/components/screening/ScreeningDashboard';
import ScreeningInterface from '@/components/screening/ScreeningInterface';
import { ArrowLeft, Users, BarChart3 } from 'lucide-react';

export default function ScreeningPage() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'screening'

  useEffect(() => {
    if (params.id) {
      fetchProjectData();
    }
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [projectResponse, documentsResponse] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/documents`)
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json();
        // Sort documents in reverse order (newest first)
        setDocuments(documentsData.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (document) => {
    const index = documents.findIndex(doc => doc.id === document.id);
    setCurrentIndex(index);
    setSelectedDocument(document);
    setView('screening');
  };

  const handleDecision = async (documentId, decision, reason) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/documents/${documentId}/screening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          reason,
        }),
      });

      if (response.ok) {
        // Update local state
        setDocuments(prev => prev.map(doc => {
          if (doc.id === documentId) {
            const newScreening = {
              userId: 'current-user', // This should come from session
              decision,
              reason,
              timestamp: new Date().toISOString(),
            };
            return {
              ...doc,
              screening: [...(doc.screening || []), newScreening]
            };
          }
          return doc;
        }));

        // Update selected document if it's the same
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(prev => ({
            ...prev,
            screening: [...(prev.screening || []), {
              userId: 'current-user',
              decision,
              reason,
              timestamp: new Date().toISOString(),
            }]
          }));
        }
      } else {
        throw new Error('Failed to save screening decision');
      }
    } catch (error) {
      console.error('Error saving screening decision:', error);
      throw error;
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedDocument(documents[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedDocument(documents[prevIndex]);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screening data...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {view === 'dashboard' ? (
                <Link
                  href={`/projects/${params.id}`}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} />
                </Link>
              ) : (
                <button
                  onClick={() => setView('dashboard')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {project.name} - Screening
                </h1>
                <p className="text-sm text-gray-600">
                  {view === 'dashboard' ? 'Review and screen documents' : 'Screening document'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  view === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={16} className="inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setView('screening')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  view === 'screening'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                disabled={!selectedDocument}
              >
                <Users size={16} className="inline mr-2" />
                Screening
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {view === 'dashboard' ? (
          <ScreeningDashboard
            projectId={params.id}
            onDocumentSelect={handleDocumentSelect}
          />
        ) : (
          <ScreeningInterface
            document={selectedDocument}
            project={project}
            onDecision={handleDecision}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentIndex}
            totalDocuments={documents.length}
          />
        )}
      </div>
    </div>
  );
}
