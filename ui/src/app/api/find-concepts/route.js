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
    const { terms_map } = await request.json();

    if (!terms_map || typeof terms_map !== 'object' || Object.keys(terms_map).length === 0) {
      return NextResponse.json({ error: 'Missing or invalid "terms_map" object in request body' }, { status: 400 });
    }

    const allSubstrings = [...new Set(Object.values(terms_map).flat())];
    
    if (allSubstrings.length === 0) {
      return NextResponse.json({ results: {} });
    }

    const embeddings = await getOllamaEmbeddings(allSubstrings);

    if (!embeddings) {
      return NextResponse.json({ error: 'Failed to generate embeddings from Ollama' }, { status: 500 });
    }

    const embeddingMap = allSubstrings.reduce((acc, sub, i) => {
      if (embeddings[i]) {
        acc[sub] = embeddings[i];
      }
      return acc;
    }, {});

    const finalResults = {};
    for (const originalTerm in terms_map) {
      const substrings = terms_map[originalTerm];
      let aggregatedForTerm = [];

      for (const sub of substrings) {
        const embeddingVector = embeddingMap[sub];
        if (embeddingVector) {
          const searchResult = await queryQdrant(embeddingVector, 3);
          if (searchResult) {
            const resultsWithSourceString = searchResult.map(res => ({
              ...res,
              found_by: sub
            }));
            aggregatedForTerm.push(...resultsWithSourceString);
          }
        }
      }

      // Find the best match by using the longest substring as the source,
      // which corresponds to the full, cleaned original string.
      const bestMatchSource = substrings.reduce((a, b) => a.length > b.length ? a : b, '');
      const fullStringMatches = aggregatedForTerm.filter(res => res.found_by === bestMatchSource);
      
      let bestMatchCui = null;
      if (fullStringMatches.length > 0) {
        bestMatchCui = fullStringMatches.sort((a,b) => b.score - a.score)[0].cui;
      }

      const formattedResults = aggregatedForTerm.map(res => ({
        text: res.payload.text,
        cui: res.payload.cui,
        score: res.score,
        source: res.payload.sourceAbbreviation || 'N/A',
        found_by: res.found_by,
        isBestMatch: res.cui === bestMatchCui,
      }));

      const uniqueResults = {};
      for (const res of formattedResults) {
        if (!uniqueResults[res.cui] || uniqueResults[res.cui].score < res.score) {
          uniqueResults[res.cui] = res;
        }
      }

      const sortedAndUnique = Object.values(uniqueResults)
        .sort((a, b) => b.score - a.score);

      finalResults[originalTerm] = sortedAndUnique;
    }

    return NextResponse.json({ results: finalResults });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
} 