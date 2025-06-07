const express = require('express');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const readline = require('readline');
const axios = require('axios');

const app = express();
const port = 3001;

// Performance Tuning - User will adjust these for testing
let LINE_BATCH_SIZE = 2000; 
let OLLAMA_CONCURRENCY_LIMIT = 50;

// Overall Progress Tracking
const GRAND_TOTAL_LINES = 11434685; // As provided by user
let cumulativeLinesScannedSystemWide = 0;
let cumulativeTimeSpentSystemWideMs = 0;
let totalConceptsEmbeddedSystemWide = 0;

// MongoDB Configuration
const mongoUrl = 'mongodb://localhost:27017'; // Replace with your MongoDB connection string if different
const dbName = 'umls_rag';
const collectionName = 'concepts';

// Ollama Configuration
const ollamaUrl = 'http://192.168.1.215:11434/api/embeddings'; // Your Ollama API endpoint
const ollamaModel = 'kronos483/MedEmbed-large-v0.1'; // Replace with your desired Ollama model

// Concept file paths
const conceptFiles = ['./MRCONSO.RRF.aa.eng', './MRCONSO.RRF.ab.eng'];

app.use(express.json());

let db;

// Connect to MongoDB and start the server
MongoClient.connect(mongoUrl)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(dbName);
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
            // Optional: Process files on startup if the collection is empty
            // processFilesAndStoreEmbeddings(); 
        });
    })
    .catch(error => {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    });

// Helper function to format milliseconds to HH:MM:SS
function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to generate embedding using Ollama
async function getEmbedding(text) {
    try {
        // Small delay to be nice to the Ollama server if sending many requests rapidly
        // await new Promise(resolve => setTimeout(resolve, 10)); // Optional: uncomment if needed
        const response = await axios.post(ollamaUrl, {
            model: ollamaModel,
            prompt: text
        });
        return response.data.embedding;
    } catch (error) {
        console.error(`Error getting embedding from Ollama for text (...${text.slice(-50)}):`, error.message);
        if (error.response) {
            // console.error('Ollama response data:', error.response.data); // Can be very verbose
        }
        return null;
    }
}

// Function to process a single concept file and store embeddings
async function processBatch(batchLines, filePath) {
    const batchStartTime = Date.now();
    if (batchLines.length === 0) return { conceptsProcessed: 0, batchDurationMs: Date.now() - batchStartTime };

    const conceptsToEmbed = [];
    const originalConceptData = [];

    for (const { lineNumber, lineContent } of batchLines) {
        const fields = lineContent.split('|');
        if (fields.length > 17) {
            const conceptText = fields[14];
            conceptsToEmbed.push(conceptText);
            originalConceptData.push({
                lineNumber,
                cui: fields[0],
                language: fields[1],
                termStatus: fields[2],
                termId: fields[3],
                stringType: fields[4],
                stringId: fields[5],
                isPreferredAtom: fields[6] === 'Y',
                atomId: fields[7],
                sourceAtomId: fields[8] || null,
                sourceConceptId: fields[9] || null,
                sourceDescriptorId: fields[10] || null,
                sourceAbbreviation: fields[11],
                termType: fields[12],
                sourceCode: fields[13],
                text: conceptText,
                sourceRestrictionLevel: fields[15],
                suppressFlag: fields[16],
                contentViewFlag: fields[17] || null,
                sourceFile: filePath
            });
        } else {
            if (lineContent.trim() !== "") {
                // console.warn(`Skipping line ${lineNumber} in ${filePath} due to insufficient fields (${fields.length})`);
            }
        }
    }

    if (conceptsToEmbed.length === 0) return { conceptsProcessed: 0, batchDurationMs: Date.now() - batchStartTime };

    const allEmbeddingResultsWithOriginalData = [];
    for (let i = 0; i < conceptsToEmbed.length; i += OLLAMA_CONCURRENCY_LIMIT) {
        const conceptTextChunk = conceptsToEmbed.slice(i, i + OLLAMA_CONCURRENCY_LIMIT);
        const originalDataChunk = originalConceptData.slice(i, i + OLLAMA_CONCURRENCY_LIMIT);
        const chunkPromises = conceptTextChunk.map(text => getEmbedding(text));
        const chunkSettledResults = await Promise.allSettled(chunkPromises);
        for (let j = 0; j < chunkSettledResults.length; j++) {
            allEmbeddingResultsWithOriginalData.push({
                ...chunkSettledResults[j],
                originalData: originalDataChunk[j]
            });
        }
    }

    const documentsToInsert = [];
    let successfullyEmbeddedInBatch = 0;
    for (const settledResult of allEmbeddingResultsWithOriginalData) {
        const conceptData = settledResult.originalData;
        if (settledResult.status === 'fulfilled' && settledResult.value) {
            documentsToInsert.push({
                ...conceptData,
                embedding: settledResult.value
            });
            successfullyEmbeddedInBatch++;
        } else {
            // console.warn(`Failed to get embedding for concept (line ${conceptData.lineNumber}): ${conceptData.text.slice(0, 50)}...`);
            // if (settledResult.reason) {
            //     const errorMessage = settledResult.reason.message ? settledResult.reason.message : String(settledResult.reason);
            //     console.error('Reason for failure:', errorMessage);
            // }
        }
    }

    if (documentsToInsert.length > 0) {
        try {
            await db.collection(collectionName).insertMany(documentsToInsert, { ordered: false });
        } catch (dbError) {
            console.error(`Error inserting batch into DB from ${filePath}:`, dbError.message);
            if (dbError.writeErrors) {
                dbError.writeErrors.forEach(err => {
                    if (err.code === 11000 && err.errmsg.includes('cui_1')) {
                        // console.warn(`Skipped duplicate CUI during batch insert: ${err.op?.cui}`);
                    } else {
                        // console.error("Individual write error:", err.errmsg);
                    }
                });
            }
        }
    }
    return { conceptsProcessed: successfullyEmbeddedInBatch, batchDurationMs: Date.now() - batchStartTime };
}

async function processFile(filePath) {
    const collection = db.collection(collectionName);
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log(`Starting to process file: ${filePath} with LINE_BATCH_SIZE=${LINE_BATCH_SIZE}, OLLAMA_CONCURRENCY_LIMIT=${OLLAMA_CONCURRENCY_LIMIT}`);
    let linesScannedInCurrentFile = 0;
    let conceptsEmbeddedInCurrentFile = 0;
    let linesBuffer = [];

    for await (const line of rl) {
        linesScannedInCurrentFile++;
        linesBuffer.push({ lineNumber: linesScannedInCurrentFile, lineContent: line });

        if (linesBuffer.length >= LINE_BATCH_SIZE) {
            const batchResult = await processBatch(linesBuffer, filePath);
            conceptsEmbeddedInCurrentFile += batchResult.conceptsProcessed;
            totalConceptsEmbeddedSystemWide += batchResult.conceptsProcessed;
            
            cumulativeLinesScannedSystemWide += linesBuffer.length; // Increment by actual lines processed in buffer
            cumulativeTimeSpentSystemWideMs += batchResult.batchDurationMs;

            linesBuffer = []; // Clear buffer

            const avgTimePerLineMs = cumulativeLinesScannedSystemWide > 0 ? cumulativeTimeSpentSystemWideMs / cumulativeLinesScannedSystemWide : 0;
            const remainingLinesSystemWide = GRAND_TOTAL_LINES - cumulativeLinesScannedSystemWide;
            const etcMs = avgTimePerLineMs > 0 && remainingLinesSystemWide > 0 ? remainingLinesSystemWide * avgTimePerLineMs : 0;
            const overallProgressPercent = GRAND_TOTAL_LINES > 0 ? (cumulativeLinesScannedSystemWide / GRAND_TOTAL_LINES) * 100 : 0;

            console.log(
                `File: ${filePath.split('/').pop()} | ` +
                `Batch time: ${batchResult.batchDurationMs}ms (${batchResult.conceptsProcessed} concepts) | ` +
                `Lines in file: ${linesScannedInCurrentFile} | ` +
                `Overall progress: ${overallProgressPercent.toFixed(2)}% | ` +
                `ETC: ${formatDuration(etcMs)}`
            );
        }
    }

    if (linesBuffer.length > 0) {
        const batchResult = await processBatch(linesBuffer, filePath);
        conceptsEmbeddedInCurrentFile += batchResult.conceptsProcessed;
        totalConceptsEmbeddedSystemWide += batchResult.conceptsProcessed;

        cumulativeLinesScannedSystemWide += linesBuffer.length;
        cumulativeTimeSpentSystemWideMs += batchResult.batchDurationMs;
        
        const avgTimePerLineMs = cumulativeLinesScannedSystemWide > 0 ? cumulativeTimeSpentSystemWideMs / cumulativeLinesScannedSystemWide : 0;
        const remainingLinesSystemWide = GRAND_TOTAL_LINES - cumulativeLinesScannedSystemWide;
        const etcMs = avgTimePerLineMs > 0 && remainingLinesSystemWide > 0 ? remainingLinesSystemWide * avgTimePerLineMs : 0;
        const overallProgressPercent = GRAND_TOTAL_LINES > 0 ? (cumulativeLinesScannedSystemWide / GRAND_TOTAL_LINES) * 100 : 0;
        
        console.log(
            `File: ${filePath.split('/').pop()} (final batch) | ` +
            `Batch time: ${batchResult.batchDurationMs}ms (${batchResult.conceptsProcessed} concepts) | ` +
            `Lines in file: ${linesScannedInCurrentFile} | ` +
            `Overall progress: ${overallProgressPercent.toFixed(2)}% | ` +
            `ETC: ${formatDuration(etcMs)}`
        );
    }
    console.log(`Finished processing ${filePath}. Total lines scanned in file: ${linesScannedInCurrentFile}. Concepts embedded from file: ${conceptsEmbeddedInCurrentFile}`);
}

// Function to process all concept files
async function processFilesAndStoreEmbeddings() {
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    if (count > 0 && !process.env.FORCE_REPROCESS) { // Added FORCE_REPROCESS check
        console.log(`Collection '${collectionName}' is not empty (${count} documents). Skipping embedding process.`);
        console.log("To re-process, drop the collection or set FORCE_REPROCESS=true environment variable when running the script.");
        return;
    }
    if (process.env.FORCE_REPROCESS) {
        console.log("FORCE_REPROCESS is true. Will process files even if collection is not empty.");
    }

    console.log("Starting to process concept files and generate embeddings...");
    for (const filePath of conceptFiles) {
        await processFile(filePath);
    }
    console.log("All concept files processed. Creating CUI index...");
    try {
        // Remove incorrect 2dsphere index for embeddings.
        // For efficient vector search (e.g., cosine similarity using $vectorSearch),
        // you need to create a Vector Search Index in MongoDB Atlas on the 'embedding' field.
        // Example Atlas Search Index definition (JSON, configure in Atlas UI/API):
        // {
        //   "name": "vector_index_on_embedding", // Or your preferred name
        //   "type": "vectorSearch",
        //   "fields": [
        //     {
        //       "type": "vector",
        //       "path": "embedding",
        //       "numDimensions": YOUR_EMBEDDING_DIMENSION, // e.g., 1024 for mxbai-embed-large
        //       "similarity": "cosine"
        //     }
        //   ]
        // }
        // Ensure YOUR_EMBEDDING_DIMENSION matches the output of your Ollama model.

        await db.collection(collectionName).createIndex({ cui: 1 }, { unique: true });
        console.log("Created unique index on 'cui'.");
        console.log("For efficient vector similarity search, configure a Vector Search Index in MongoDB Atlas.");
        console.log("The current /find-similar endpoint uses brute-force calculation for non-Atlas setups.");

    } catch (indexError) {
        console.error("Error creating CUI index:", indexError);
    }
    console.log("Embeddings generation and initial CUI index creation complete.");
}


// REST endpoint to find similar concepts
app.post('/find-similar', async (req, res) => {
    const { texts, top_k = 5 } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of "texts" in the request body.' });
    }

    if (!db) {
        return res.status(503).json({ error: 'Database not initialized. Please try again later.' });
    }

    try {
        const results = [];
        const collection = db.collection(collectionName);

        for (const queryText of texts) {
            const queryEmbedding = await getEmbedding(queryText);
            if (!queryEmbedding) {
                results.push({ query: queryText, error: 'Failed to generate embedding for query text.' });
                continue;
            }

            // --- Option 1: MongoDB Atlas with $vectorSearch (Recommended for performance) ---
            // This section assumes you are using MongoDB Atlas and have created a
            // Vector Search Index named (e.g.) "vector_index_on_embedding" on the 'embedding' field.
            // The index definition would look something like:
            // {
            //   "name": "vector_index_on_embedding",
            //   "type": "vectorSearch",
            //   "fields": [
            //     {
            //       "type": "vector",
            //       "path": "embedding",
            //       "numDimensions": 1024, // Replace with your actual embedding dimension
            //       "similarity": "cosine"
            //     }
            //   ]
            // }
            /* // UNCOMMENT AND USE THIS BLOCK IF USING MONGODB ATLAS WITH A VECTOR SEARCH INDEX
            const pipeline = [
                {
                    $vectorSearch: {
                        index: 'vector_index_on_embedding', // Your Atlas Search index name
                        path: 'embedding', // Field containing the vectors
                        queryVector: queryEmbedding,
                        numCandidates: top_k * 10, // Number of candidates to consider (can be tuned)
                        limit: top_k // Number of results to return
                    }
                },
                {
                    $project: { // Project only the fields you need, including the score
                        _id: 0,
                        cui: 1,
                        text: 1,
                        language: 1,
                        termType: 1,
                        sourceAbbreviation: 1,
                        score: { $meta: 'vectorSearchScore' } // Similarity score from $vectorSearch
                    }
                }
            ];

            const similarConcepts = await collection.aggregate(pipeline).toArray();
            results.push({
                query: queryText,
                matches: similarConcepts.map(doc => ({ ...doc, similarity: doc.score })) // map score to similarity
            });
            */ // END OF ATLAS $vectorSearch BLOCK

            // --- Option 2: Brute-force similarity calculation (for local MongoDB / no Atlas Search) ---
            // This is the current default. It's inefficient for large datasets.
            // If you uncommented the Atlas block above, you can comment out or remove this section.
            if (true) { // This condition is to easily switch; set to false if using Atlas block above
                const allConcepts = await collection.find({ embedding: { $exists: true } }).toArray();
                if (allConcepts.length === 0) {
                    results.push({ query: queryText, matches: [] });
                    continue;
                }

                const similarities = allConcepts.map(conceptDoc => {
                    return {
                        cui: conceptDoc.cui,
                        text: conceptDoc.text,
                        language: conceptDoc.language,
                        termType: conceptDoc.termType,
                        sourceAbbreviation: conceptDoc.sourceAbbreviation,
                        similarity: cosineSimilarity(queryEmbedding, conceptDoc.embedding)
                    };
                });

                similarities.sort((a, b) => b.similarity - a.similarity);
                results.push({
                    query: queryText,
                    matches: similarities.slice(0, top_k)
                });
            }
        }
        res.json(results);

    } catch (error) {
        console.error('Error in /find-similar endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function for cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0; // Or handle error appropriately
    }
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) { // Prevent division by zero
        return 0;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}


// Endpoint to manually trigger processing of files
app.post('/process-files', async (req, res) => {
    if (!db) {
        return res.status(503).json({ error: 'Database not initialized. Please try again later.' });
    }
    console.log("Received request to /process-files");

    // Allow overriding parameters via request body for testing
    if (req.body.LINE_BATCH_SIZE) {
        LINE_BATCH_SIZE = parseInt(req.body.LINE_BATCH_SIZE, 10);
        console.log(`Overriding LINE_BATCH_SIZE to ${LINE_BATCH_SIZE} from request.`);
    }
    if (req.body.OLLAMA_CONCURRENCY_LIMIT) {
        OLLAMA_CONCURRENCY_LIMIT = parseInt(req.body.OLLAMA_CONCURRENCY_LIMIT, 10);
        console.log(`Overriding OLLAMA_CONCURRENCY_LIMIT to ${OLLAMA_CONCURRENCY_LIMIT} from request.`);
    }
    if (req.body.FORCE_REPROCESS) {
        process.env.FORCE_REPROCESS = "true"; // Set env var for this run
    }

    try {
        if (global.isProcessingFiles) {
            return res.status(429).json({ message: "File processing is already in progress." });
        }
        global.isProcessingFiles = true;
        
        await processFilesAndStoreEmbeddings();
        
        global.isProcessingFiles = false;
        // Reset FORCE_REPROCESS after the run if it was set by this request
        if (req.body.FORCE_REPROCESS) delete process.env.FORCE_REPROCESS;
        res.status(200).json({ message: "File processing initiated and completed (or skipped/forced)." });
    } catch (error) {
        global.isProcessingFiles = false;
        if (req.body.FORCE_REPROCESS) delete process.env.FORCE_REPROCESS;
        console.error("Error during manual file processing:", error);
        res.status(500).json({ error: "Failed to process files." });
    }
});


// Basic GET endpoint to check if server is up
app.get('/', (req, res) => {
    res.send('UMLS RAG API is running. Use POST /find-similar to find concepts or POST /process-files to load data.');
});

// Note: The `createIndex({ embedding: "2dsphere" })` is not correct for cosine similarity.
// MongoDB's `2dsphere` is for geospatial queries. For vector search (cosine similarity),
// you typically need MongoDB Atlas and its `$vectorSearch` aggregation stage, or a dedicated vector database.
// The current `find-similar` endpoint fetches all concepts and calculates similarity in the application code,
// which is very inefficient for large datasets. This should be replaced with a proper vector search solution
// if using MongoDB Atlas or an alternative for production environments.
// For local/development, ensure your Ollama model produces embeddings of a consistent dimension. 