import { NextResponse } from 'next/server';
import axios from 'axios';
import { QdrantClient } from '@qdrant/js-client-rest';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.1.215:11434/api/embed';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'kronos483/MedEmbed-large-v0.1';
const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = process.env.QDRANT_PORT || 6333;
const QDRANT_COLLECTION_NAME = process.env.QDRANT_COLLECTION_NAME || 'umls_concepts';

async function getOllamaEmbeddings(texts) {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      input: texts,
    });
    return response.data.embeddings || null;
  } catch (error) {
    console.error('Error getting embeddings from Ollama:', error.message);
    return null;
  }
}

async function queryQdrant(embeddingVector, topK = 10) {
  if (!embeddingVector || embeddingVector.length === 0) return null;
  const qdrantClient = new QdrantClient({ host: QDRANT_HOST, port: QDRANT_PORT });
  try {
    return await qdrantClient.search(QDRANT_COLLECTION_NAME, {
      vector: embeddingVector,
      limit: topK,
      with_payload: true,
    });
  } catch (error) {
    console.error('Error querying Qdrant:', error.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { terms } = await request.json();

    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid "terms" array in request body' }, { status: 400 });
    }

    const embeddings = await getOllamaEmbeddings(terms);

    if (!embeddings) {
      return NextResponse.json({ error: 'Failed to generate embeddings from Ollama' }, { status: 500 });
    }

    const results = {};
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      const embedding = embeddings[i];
      if (embedding) {
        const searchResult = await queryQdrant(embedding, 10);
        results[term] = searchResult ? searchResult.map(res => ({
          text: res.payload.text,
          cui: res.payload.cui,
          score: res.score,
        })) : [];
      } else {
        results[term] = [];
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 