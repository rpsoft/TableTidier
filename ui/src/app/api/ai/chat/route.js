import { NextResponse } from 'next/server';
import { ollamaClient } from '@/lib/ai/ollama-client';

export async function POST(request) {
  try {
    const { message, context = '' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await ollamaClient.chat(message, context);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
