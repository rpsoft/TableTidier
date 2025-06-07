const axios = require('axios');
const { QdrantClient } = require('@qdrant/js-client-rest');

// --- Configuration ---
// Ollama Configuration (ensure this matches your setup from index.js)
const OLLAMA_URL = 'http://192.168.1.215:11434/api/embeddings';
const OLLAMA_MODEL = 'kronos483/MedEmbed-large-v0.1';

// Qdrant Configuration (ensure this matches your import script)
const QDRANT_HOST = 'localhost';
const QDRANT_PORT = 6333;
const QDRANT_COLLECTION_NAME = 'umls_concepts';
const VECTOR_NAME = 'embedding'; // If you named your vector something other than the default during import

// --- Helper Functions ---

/**
 * Generates an embedding for the given text using the configured Ollama instance.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]|null>} The embedding vector or null if an error occurs.
 */
async function getOllamaEmbedding(text) {
    if (!text || text.trim() === '') {
        console.error('Input text cannot be empty.');
        return null;
    }
    console.log(`Generating embedding for: "${text}"...`);
    try {
        const response = await axios.post(OLLAMA_URL, {
            model: OLLAMA_MODEL,
            prompt: text,
        });
        if (response.data && response.data.embedding) {
            console.log('Embedding generated successfully.');
            return response.data.embedding;
        }
        console.error('Ollama response did not contain an embedding:', response.data);
        return null;
    } catch (error) {
        console.error(`Error getting embedding from Ollama for text "${text}":`, error.message);
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
    const searchTerm = process.argv[2]; // Get search term from command line argument

    if (!searchTerm) {
        console.log('Please provide a search term as a command line argument.');
        console.log('Usage: node tools/query-qdrant.js "Your search query here"');
        return;
    }

    console.log(`Processing search for: "${searchTerm}"`);

    const embedding = await getOllamaEmbedding(searchTerm);

    if (embedding) {
        const results = await queryQdrant(embedding, 50); // Get top 5 results

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
    }
}

main().catch(error => {
    console.error('An unexpected error occurred in the main function:', error);
}); 
