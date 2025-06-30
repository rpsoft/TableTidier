# Document-Based Structure

## Overview

The system has been restructured to support a document-based approach where:

- **Collections** contain **Documents**
- **Documents** contain **Tables**
- Users can upload HTML documents and extract tables from them

## New Data Model

### Collections
- Collections are the top-level organizational unit
- Each collection belongs to a user
- Collections can contain multiple documents

### Documents
- Documents are HTML files uploaded by users
- Each document belongs to a collection
- Documents can contain multiple tables
- Tables are extracted from documents using the "Extract Tables" functionality

### Tables
- Tables are extracted from documents
- Each table belongs to both a document and a collection
- Tables maintain their original HTML structure
- Tables can be annotated and processed using the existing annotation system

## API Endpoints

### Collections
- `GET /api/collections` - List all collections for the user
- `POST /api/collections` - Create a new collection
- `GET /api/collections/[id]` - Get a specific collection
- `PATCH /api/collections/[id]` - Update collection description
- `DELETE /api/collections/[id]` - Delete a collection

### Documents
- `GET /api/collections/[id]/documents` - List all documents in a collection
- `POST /api/collections/[id]/documents` - Upload a new document
- `GET /api/collections/[id]/documents/[documentId]` - Get a specific document
- `DELETE /api/collections/[id]/documents/[documentId]` - Delete a document

### Table Extraction
- `POST /api/collections/[id]/documents/[documentId]/extract-tables` - Extract tables from a document

### Tables
- `GET /api/collections/[id]/documents/[documentId]/tables` - List all tables in a document
- `GET /api/collections/[id]/documents/[documentId]/tables/[tableId]` - Get a specific table
- `DELETE /api/collections/[id]/documents/[documentId]/tables/[tableId]` - Delete a table

## User Interface

### Collection View
- Shows all documents in the collection
- Allows uploading new documents
- Displays document metadata (name, upload date, table count)
- Provides "Extract Tables" functionality for each document

### Document View
- Shows the document content preview
- Lists all extracted tables
- Provides "Extract Tables" button to find and extract tables
- Allows navigation back to collection

### Table View
- Existing table annotation interface remains unchanged
- Tables are accessed via the document view

## Workflow

1. **Create Collection**: User creates a new collection
2. **Upload Document**: User uploads an HTML document to the collection
3. **Extract Tables**: User clicks "Extract Tables" to find and extract tables from the document
4. **Annotate Tables**: User can access individual tables for annotation and processing
5. **Download Results**: User can download extracted data in JSON or CSV format

## Technical Implementation

### Database Schema Changes
- Added `Document` model with fields: id, name, fileName, htmlContent, collectionId, userId, createdAt, updatedAt, description, tableCount
- Updated `Table` model to include `documentId` field
- Tables now reference both collection and document

### Table Extraction
- Uses jsdom for robust HTML parsing
- Falls back to regex-based extraction if jsdom fails
- Automatically generates meaningful filenames based on table captions
- Updates document table count after extraction

### File Structure
```
ui/src/
├── app/
│   ├── api/
│   │   └── collections/
│   │       └── [id]/
│   │           ├── documents/
│   │           │   ├── route.js
│   │           │   └── [documentId]/
│   │           │       ├── route.js
│   │           │       ├── extract-tables/
│   │           │       │   └── route.js
│   │           │       └── tables/
│   │           │           ├── route.js
│   │           │           └── [tableId]/
│   │           │               └── route.js
│   │           └── tables/ (legacy - for backward compatibility)
│   └── collections/
│       └── [id]/
│           ├── page.js (updated to show documents)
│           └── documents/
│               └── [documentId]/
│                   └── page.js (new document view)
├── components/
│   ├── documents/
│   │   ├── DocumentList.js (new)
│   │   └── UploadDocumentModal.js (new)
│   └── tables/
│       └── TableList.js (updated for document structure)
└── database/
    ├── collection.model.js (unchanged)
    ├── document.model.js (new)
    └── table.model.js (updated)
```

## Migration Notes

- Existing tables will need to be migrated to include documentId
- Users may need to re-upload documents to take advantage of the new structure
- The legacy table upload functionality is maintained for backward compatibility

## Testing

A test document (`ui/public/test-document.html`) is provided with multiple tables to test the extraction functionality. 