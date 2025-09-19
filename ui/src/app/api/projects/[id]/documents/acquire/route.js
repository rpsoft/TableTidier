import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';
import { Document } from '@/database/document.model';
import { AuditLog } from '@/database/audit.model';
import { acquirePubMedDocument } from '@/lib/api/pubmed';
import { acquireClinicalTrialDocument } from '@/lib/api/clinicaltrials';
import { acquireCochraneDocument } from '@/lib/api/cochrane';
import { acquireEmbaseDocument } from '@/lib/api/embase';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { source, documentIds, searchQuery } = await request.json();

    console.log('Acquisition request:', { source, documentIds, searchQuery });

    if (!source || !documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Source and document IDs are required' }, { status: 400 });
    }

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
      isActive: true,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const acquiredDocuments = [];

    const failedDocuments = [];
    
    try {
      for (const documentId of documentIds) {
        console.log(`Processing document ID: ${documentId} from source: ${source}`);
        
        try {
          let documentData;
          
          switch (source) {
            case 'pubmed':
              documentData = await acquirePubMedDocument(documentId);
              break;
            case 'clinicaltrials':
              documentData = await acquireClinicalTrialDocument(documentId);
              break;
            case 'cochrane':
              documentData = await acquireCochraneDocument(documentId);
              break;
            case 'embase':
              documentData = await acquireEmbaseDocument(documentId);
              break;
            default:
              throw new Error(`Invalid data source: ${source}`);
          }

          if (documentData) {
            // Create document in database
            const document = new Document({
              projectId,
              fileName: `${documentData.title || 'Document'}_${documentId}.html`,
              originalContent: documentData.content,
              metadata: {
                title: documentData.title,
                authors: documentData.authors || [],
                journal: documentData.journal,
                year: documentData.year,
                doi: documentData.doi,
                abstract: documentData.abstract,
                keywords: documentData.keywords || [],
                source: source,
                sourceId: documentId,
                searchQuery: searchQuery
              },
              text: documentData.text || [],
              tables: documentData.tables || [],
              uploadedBy: session.user.email,
              acquisitionMethod: 'api',
              acquisitionSource: source,
              acquisitionQuery: searchQuery
            });

            await document.save();
            acquiredDocuments.push(document);

            // Log the action
            const auditLog = new AuditLog({
              projectId,
              userId: session.user.email,
              action: 'document_acquired',
              details: { 
                documentId: document.id, 
                source: source,
                sourceId: documentId,
                searchQuery: searchQuery
              },
            });

            await auditLog.save();
            console.log(`Successfully acquired document: ${documentData.title}`);
          }
        } catch (docError) {
          console.error(`Failed to acquire document ${documentId}:`, docError);
          failedDocuments.push({
            documentId,
            error: docError.message
          });
        }
      }

      // Return results with information about failures
      const response = {
        success: true,
        acquiredDocuments,
        totalRequested: documentIds.length,
        totalAcquired: acquiredDocuments.length,
        failedDocuments
      };
      
      if (failedDocuments.length > 0) {
        response.warnings = `${failedDocuments.length} document(s) could not be acquired`;
      }
      
      return NextResponse.json(response, { status: 201 });
    } catch (apiError) {
      console.error(`Error acquiring documents from ${source}:`, apiError);
      return NextResponse.json({ 
        error: `Failed to acquire documents from ${source}: ${apiError.message}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Acquisition error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
