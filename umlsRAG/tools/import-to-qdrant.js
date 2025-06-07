const { MongoClient } = require('mongodb');
const { QdrantClient } = require('@qdrant/js-client-rest');

// Configuration
const MONGO_URI = 'mongodb://localhost:27017'; // Replace with your MongoDB URI if different
const MONGO_DB_NAME = 'umls_rag';
const MONGO_COLLECTION_NAME = 'concepts';

const QDRANT_HOST = 'localhost'; // Replace with your Qdrant host if different
const QDRANT_PORT = 6333; // Replace with your Qdrant port if different
const QDRANT_COLLECTION_NAME = 'umls_concepts';
const VECTOR_SIZE = 1024; // Based on the example embedding
const BATCH_SIZE = 1000; // Number of documents to upload in a single batch


async function main() {
    console.log('Starting UMLS data import to Qdrant...');

    const mongoClient = new MongoClient(MONGO_URI);
    const qdrantClient = new QdrantClient({ host: QDRANT_HOST, port: QDRANT_PORT });

    try {
        // Connect to MongoDB
        await mongoClient.connect();
        console.log('Connected to MongoDB.');
        const db = mongoClient.db(MONGO_DB_NAME);
        const mongoCollection = db.collection(MONGO_COLLECTION_NAME);

        // Check and create Qdrant collection
        const collections = await qdrantClient.getCollections();
        const collectionExists = collections.collections.some(c => c.name === QDRANT_COLLECTION_NAME);

        if (!collectionExists) {
            console.log(`Collection '${QDRANT_COLLECTION_NAME}' does not exist. Creating...`);
            await qdrantClient.createCollection(QDRANT_COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine',
                },
            });
            console.log(`Collection '${QDRANT_COLLECTION_NAME}' created successfully.`);
        } else {
            console.log(`Collection '${QDRANT_COLLECTION_NAME}' already exists.`);
        }

        // Fetch data from MongoDB and upload to Qdrant
        console.log(`Fetching concepts from MongoDB collection '${MONGO_COLLECTION_NAME}'...`);
        const cursor = mongoCollection.find({});
        let documentsBatch = [];
        let totalDocsProcessed = 0;

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            if (doc && doc.embedding && doc._id) {
                const { embedding, _id, ...payload } = doc; // Separate embedding and _id, rest is payload

                // Ensure payload does not contain complex objects like $oid if not desired
                // For this script, we'll assume the payload can be directly stringified or is simple.
                // If _id is an ObjectId, convert it to string and then to a UUID-like format.
                let pointIdStr = typeof _id === 'object' && _id.$oid ? _id.$oid : String(_id);
                
                // Pad with leading zeros to 32 characters if it's a 24-char hex string (MongoDB ObjectId)
                if (pointIdStr.length === 24 && /^[0-9a-fA-F]+$/.test(pointIdStr)) {
                    pointIdStr = '00000000' + pointIdStr;
                }

                // Format as UUID if it's 32 hex characters
                let pointId;
                if (pointIdStr.length === 32 && /^[0-9a-fA-F]+$/.test(pointIdStr)) {
                    pointId = `${pointIdStr.substring(0, 8)}-${pointIdStr.substring(8, 12)}-${pointIdStr.substring(12, 16)}-${pointIdStr.substring(16, 20)}-${pointIdStr.substring(20, 32)}`;
                } else {
                    // If it's not a 24 or 32 char hex string, we might have an issue or it's already a UUID.
                    // For simplicity, we'll use it as is, but this might need more robust handling.
                    pointId = pointIdStr;
                }

                documentsBatch.push({
                    id: pointId,
                    vector: embedding,
                    payload: payload, // All other fields from MongoDB doc
                });

                if (documentsBatch.length >= BATCH_SIZE) {
                    console.log(`Uploading batch of ${documentsBatch.length} documents to Qdrant...`);
                    await qdrantClient.upsert(QDRANT_COLLECTION_NAME, {
                        wait: true, // Wait for operation to complete
                        points: documentsBatch,
                    });
                    totalDocsProcessed += documentsBatch.length;
                    console.log(`Uploaded ${totalDocsProcessed} documents so far.`);
                    documentsBatch = []; // Reset batch
                }
            }
        }

        // Upload any remaining documents in the last batch
        if (documentsBatch.length > 0) {
            console.log(`Uploading the final batch of ${documentsBatch.length} documents to Qdrant...`);
            await qdrantClient.upsert(QDRANT_COLLECTION_NAME, {
                wait: true,
                points: documentsBatch,
            });
            totalDocsProcessed += documentsBatch.length;
            console.log(`Uploaded ${totalDocsProcessed} documents in total.`);
        }

        if (totalDocsProcessed === 0) {
            console.log('No documents found in MongoDB collection or no documents with embeddings.');
        } else {
            console.log(`Successfully imported ${totalDocsProcessed} documents from MongoDB to Qdrant collection '${QDRANT_COLLECTION_NAME}'.`);
        }

    } catch (error) {
        console.error('An error occurred during the import process:', error);
    } finally {
        // Close connections
        await mongoClient.close();
        console.log('MongoDB connection closed.');
        // qdrantClient does not have an explicit close method in the version used here.
        console.log('Script finished.');
    }
}

main().catch(console.error);
