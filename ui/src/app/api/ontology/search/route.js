import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ai/ollama-client';

export async function POST(request) {
  try {
    const { query, ontologyType = 'UMLS' } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use AI to map concept to ontology
    const mapping = await ollamaClient.mapToOntology(query, ontologyType);

    if (!mapping) {
      return NextResponse.json({ error: 'Failed to map concept' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mapping,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ontology search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
