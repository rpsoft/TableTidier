import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ai/ollama-client';

export async function POST(request) {
  try {
    const { project, documents } = await request.json();

    if (!project || !documents) {
      return NextResponse.json({ error: 'Project and documents are required' }, { status: 400 });
    }

    // Analyze each document
    const documentAnalyses = [];
    for (const doc of documents.slice(0, 5)) { // Limit to first 5 documents for performance
      try {
        const analysis = await ollamaClient.analyzeDocument(doc);
        if (analysis) {
          documentAnalyses.push({
            documentId: doc.id,
            analysis
          });
        }
      } catch (error) {
        console.error(`Error analyzing document ${doc.id}:`, error);
      }
    }

    // Generate project-level suggestions
    const suggestions = await ollamaClient.generateSuggestions(project, documents);

    // Calculate summary statistics
    const totalDocs = documents.length;
    const screenedDocs = documents.filter(doc => doc.screening?.length > 0).length;
    const includedDocs = documents.filter(doc => {
      const latestScreening = doc.screening?.[doc.screening.length - 1];
      return latestScreening?.decision === 'included';
    }).length;

    const summary = {
      totalDocuments: totalDocs,
      screenedDocuments: screenedDocs,
      includedDocuments: includedDocs,
      dataQualityScore: Math.round((screenedDocs / totalDocs) * 100),
      completenessScore: Math.round((includedDocs / totalDocs) * 100)
    };

    // Generate insights based on analysis
    const insights = [];
    if (documentAnalyses.length > 0) {
      const studyTypes = documentAnalyses.map(d => d.analysis.summary.studyType).filter(Boolean);
      const mostCommonType = studyTypes.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, studyTypes[0]);

      insights.push({
        id: 'study_type_insight',
        type: 'pattern',
        title: 'Study Design Distribution',
        description: `Most studies (${Math.round((studyTypes.filter(t => t === mostCommonType).length / studyTypes.length) * 100)}%) used ${mostCommonType} design.`,
        confidence: 0.9,
        actionable: true,
        category: 'methodology'
      });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        summary,
        documentAnalyses,
        suggestions,
        insights,
        recommendations: suggestions?.overall || []
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
