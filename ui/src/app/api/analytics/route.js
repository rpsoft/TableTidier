import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';
import { Document } from '@/database/document.model';
import { Project } from '@/database/project.model';

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get project data
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all documents for this project
    const documents = await Document.find({ projectId }).lean();

    // Calculate analytics
    const analytics = calculateProjectAnalytics(project, documents);

    return NextResponse.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function calculateProjectAnalytics(project, documents) {
  const totalDocuments = documents.length;
  const screenedDocuments = documents.filter(doc => doc.screening?.length > 0).length;
  const includedDocuments = documents.filter(doc => {
    const latestScreening = doc.screening?.[doc.screening.length - 1];
    return latestScreening?.decision === 'included';
  }).length;
  const excludedDocuments = documents.filter(doc => {
    const latestScreening = doc.screening?.[doc.screening.length - 1];
    return latestScreening?.decision === 'excluded';
  }).length;
  const pendingDocuments = totalDocuments - screenedDocuments;

  // Calculate screening progress
  const screeningProgress = totalDocuments > 0 ? Math.round((screenedDocuments / totalDocuments) * 100) : 0;
  const inclusionRate = screenedDocuments > 0 ? Math.round((includedDocuments / screenedDocuments) * 100) : 0;

  // Calculate data extraction progress
  const documentsWithExtraction = documents.filter(doc => doc.extractedData && doc.extractedData.length > 0).length;
  const extractionProgress = includedDocuments > 0 ? Math.round((documentsWithExtraction / includedDocuments) * 100) : 0;

  // Calculate quality assessment progress
  const documentsWithQA = documents.filter(doc => doc.qualityAssessment).length;
  const qaProgress = includedDocuments > 0 ? Math.round((documentsWithQA / includedDocuments) * 100) : 0;

  // Calculate time-based metrics
  const now = new Date();
  const projectStart = new Date(project.createdAt);
  const daysSinceStart = Math.ceil((now - projectStart) / (1000 * 60 * 60 * 24));
  
  const estimatedCompletion = project.estimatedCompletion ? new Date(project.estimatedCompletion) : null;
  const daysToCompletion = estimatedCompletion ? Math.ceil((estimatedCompletion - now) / (1000 * 60 * 60 * 24)) : null;

  // Calculate document types distribution
  const documentTypes = documents.reduce((acc, doc) => {
    const type = doc.fileType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Calculate publication year distribution
  const yearDistribution = documents.reduce((acc, doc) => {
    const year = doc.metadata?.publicationYear;
    if (year) {
      acc[year] = (acc[year] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate screening reasons for excluded documents
  const exclusionReasons = documents
    .filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'excluded';
    })
    .reduce((acc, doc) => {
      const reason = doc.screening?.[doc.screening.length - 1]?.reason || 'Not specified';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

  // Calculate team activity
  const teamActivity = documents.reduce((acc, doc) => {
    if (doc.screening?.length > 0) {
      doc.screening.forEach(screening => {
        const reviewer = screening.reviewer || 'Unknown';
        acc[reviewer] = (acc[reviewer] || 0) + 1;
      });
    }
    return acc;
  }, {});

  // Calculate data quality metrics
  const qualityMetrics = {
    completeness: Math.round((documentsWithExtraction / Math.max(includedDocuments, 1)) * 100),
    consistency: calculateConsistencyScore(documents),
    accuracy: calculateAccuracyScore(documents)
  };

  return {
    overview: {
      totalDocuments,
      screenedDocuments,
      includedDocuments,
      excludedDocuments,
      pendingDocuments,
      screeningProgress,
      inclusionRate,
      extractionProgress,
      qaProgress
    },
    timeline: {
      projectStart: projectStart.toISOString(),
      daysSinceStart,
      estimatedCompletion: estimatedCompletion?.toISOString(),
      daysToCompletion,
      averageDocumentsPerDay: daysSinceStart > 0 ? Math.round(screenedDocuments / daysSinceStart) : 0
    },
    distributions: {
      documentTypes,
      yearDistribution,
      exclusionReasons,
      teamActivity
    },
    quality: qualityMetrics,
    trends: calculateTrends(documents),
    recommendations: generateRecommendations(project, documents, {
      screeningProgress,
      extractionProgress,
      qaProgress,
      inclusionRate
    })
  };
}

function calculateConsistencyScore(documents) {
  // Simple consistency check based on data completeness
  const documentsWithCompleteData = documents.filter(doc => {
    const hasTitle = doc.metadata?.title;
    const hasAuthors = doc.metadata?.authors?.length > 0;
    const hasAbstract = doc.metadata?.abstract;
    const hasYear = doc.metadata?.publicationYear;
    return hasTitle && hasAuthors && hasAbstract && hasYear;
  }).length;
  
  return documents.length > 0 ? Math.round((documentsWithCompleteData / documents.length) * 100) : 0;
}

function calculateAccuracyScore(documents) {
  // Simple accuracy check based on screening consistency
  const documentsWithMultipleScreenings = documents.filter(doc => doc.screening?.length > 1);
  const consistentScreenings = documentsWithMultipleScreenings.filter(doc => {
    const decisions = doc.screening.map(s => s.decision);
    return new Set(decisions).size === 1; // All decisions are the same
  }).length;
  
  return documentsWithMultipleScreenings.length > 0 ? 
    Math.round((consistentScreenings / documentsWithMultipleScreenings.length) * 100) : 100;
}

function calculateTrends(documents) {
  // Calculate daily screening trends over the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyTrends = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyTrends[dateStr] = {
      screened: 0,
      included: 0,
      excluded: 0
    };
  }
  
  documents.forEach(doc => {
    if (doc.screening?.length > 0) {
      const screeningDate = new Date(doc.screening[0].timestamp);
      if (screeningDate >= thirtyDaysAgo) {
        const dateStr = screeningDate.toISOString().split('T')[0];
        if (dailyTrends[dateStr]) {
          dailyTrends[dateStr].screened++;
          const decision = doc.screening[doc.screening.length - 1].decision;
          if (decision === 'included') {
            dailyTrends[dateStr].included++;
          } else if (decision === 'excluded') {
            dailyTrends[dateStr].excluded++;
          }
        }
      }
    }
  });
  
  return Object.entries(dailyTrends).map(([date, data]) => ({
    date,
    ...data
  }));
}

function generateRecommendations(project, documents, metrics) {
  const recommendations = [];
  
  if (metrics.screeningProgress < 50) {
    recommendations.push({
      type: 'screening',
      priority: 'high',
      title: 'Accelerate Screening Process',
      description: 'Consider increasing screening capacity or using AI-assisted screening to speed up the process.',
      action: 'Review screening workflow and consider automation'
    });
  }
  
  if (metrics.inclusionRate < 10) {
    recommendations.push({
      type: 'criteria',
      priority: 'medium',
      title: 'Review Inclusion Criteria',
      description: 'Very low inclusion rate suggests criteria might be too restrictive.',
      action: 'Review and potentially adjust inclusion/exclusion criteria'
    });
  }
  
  if (metrics.extractionProgress < 30) {
    recommendations.push({
      type: 'extraction',
      priority: 'high',
      title: 'Focus on Data Extraction',
      description: 'Data extraction is behind schedule. Consider prioritizing this phase.',
      action: 'Allocate more resources to data extraction tasks'
    });
  }
  
  if (metrics.qaProgress < 20) {
    recommendations.push({
      type: 'quality',
      priority: 'medium',
      title: 'Implement Quality Assessment',
      description: 'Quality assessment should be conducted for included studies.',
      action: 'Begin quality assessment for screened studies'
    });
  }
  
  return recommendations;
}
