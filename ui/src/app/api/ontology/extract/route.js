import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ai/ollama-client';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use AI to extract concepts from text
    const concepts = await ollamaClient.extractConcepts(text);

    return NextResponse.json({
      success: true,
      concepts,
      count: concepts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Concept extraction error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
