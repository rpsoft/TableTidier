const axios = require('axios');
const { QdrantClient } = require('@qdrant/js-client-rest');

// --- Configuration ---
// Ollama Configuration (ensure this matches your setup from index.js)
const OLLAMA_URL = 'http://192.168.1.215:11434/api/embed'; // Updated endpoint
const OLLAMA_MODEL = 'kronos483/MedEmbed-large-v0.1';

// Qdrant Configuration (ensure this matches your import script)
const QDRANT_HOST = 'localhost';
const QDRANT_PORT = 6333;
const QDRANT_COLLECTION_NAME = 'umls_concepts';
const VECTOR_NAME = 'embedding'; // If you named your vector something other than the default during import

// --- Helper Functions ---

/**
 * Generates embeddings for the given texts using the configured Ollama instance.
 * @param {string[]} texts The texts to embed.
 * @returns {Promise<number[][]|null>} An array of embedding vectors or null if an error occurs.
 */
async function getOllamaEmbeddings(texts) {
    if (!texts || texts.length === 0) {
        console.error('Input texts array cannot be empty.');
        return null;
    }
    console.log(`Generating embeddings for ${texts.length} terms...`);
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: OLLAMA_MODEL,
            input: texts,
        });
        if (response.data && response.data.embeddings) {
            console.log('Embeddings generated successfully.');
            return response.data.embeddings;
        }
        console.error('Ollama response did not contain embeddings:', response.data);
        return null;
    } catch (error) {
        console.error(`Error getting embeddings from Ollama:`, error.message);
        if (error.response) {
            // console.error('Ollama response data:', error.response.data); // Can be verbose
        }
        return null;
    }
}

/**
 * Queries the Qdrant collection to find the closest matches to the given embedding.
 * @param {number[]} embeddingVector The vector to search with.
 * @param {number} topK The number of top results to retrieve.
 * @returns {Promise<any[]|null>} An array of search results or null if an error occurs.
 */
async function queryQdrant(embeddingVector, topK = 3) {
    if (!embeddingVector || embeddingVector.length === 0) {
        console.error('Embedding vector cannot be empty.');
        return null;
    }
    console.log(`Querying Qdrant with ${topK} nearest neighbors...`);
    const qdrantClient = new QdrantClient({ host: QDRANT_HOST, port: QDRANT_PORT });

    try {
        const searchResult = await qdrantClient.search(QDRANT_COLLECTION_NAME, {
            vector: embeddingVector,
            limit: topK,
            with_payload: true, // Include the payload in the results
            // If you used a named vector in your collection, specify it here:
            // vector_name: VECTOR_NAME, // Uncomment if you have a named vector other than default
        });
        console.log('Qdrant query successful.');
        return searchResult;
    } catch (error) {
        console.error('Error querying Qdrant:', error.message);
        if (error.data) {
            console.error('Qdrant error details:', error.data);
        }
        return null;
    }
}

// --- Main Execution ---
async function main() {
    const searchTerms = process.argv.slice(2); // Get all search terms from command line arguments

    if (searchTerms.length === 0) {
        console.log('Please provide one or more search terms as command line arguments.');
        console.log('Usage: node tools/query-qdrant-multiple.js "Your search query here" "Another query"');
        return;
    }

    console.log(`Processing search for: "${searchTerms.join('", "')}"`);

    const embeddings = await getOllamaEmbeddings(searchTerms);

    if (embeddings && embeddings.length > 0) {
        for (let i = 0; i < searchTerms.length; i++) {
            const searchTerm = searchTerms[i];
            const embedding = embeddings[i];
            console.log(`\n--- Processing search for: "${searchTerm}" ---`);

            if (embedding) {
                const results = await queryQdrant(embedding, 50); // Get top 50 results

                if (results && results.length > 0) {
                    console.log('\n--- Top Search Results ---');
                    results.forEach((result, index) => {
                        if (result.payload) {
                            console.log(`Result ${index + 1}: ${result.score.toFixed(4)} | ${result.payload.text || 'N/A'} | CUI: ${result.payload.cui || 'N/A'} | Source: ${result.payload.sourceAbbreviation || 'N/A'}`)
                            // Add any other payload fields you want to display
                        }
                    });
                } else if (results) {
                    console.log('No results found in Qdrant for the given query.');
                } else {
                    console.log('Failed to retrieve results from Qdrant.');
                }
            } else {
                 console.log(`Failed to generate embedding for "${searchTerm}".`);
            }
        }
    } else {
        console.log('Failed to generate any embeddings from Ollama.');
    }
}

main().catch(error => {
    console.error('An unexpected error occurred in the main function:', error);
}); 
