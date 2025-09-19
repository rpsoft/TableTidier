import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';
import { AuditLog } from '@/database/audit.model';
import { searchPubMed } from '@/lib/api/pubmed';
import { searchClinicalTrials } from '@/lib/api/clinicaltrials';
import { searchCochrane } from '@/lib/api/cochrane';
import { searchEmbase } from '@/lib/api/embase';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { query, source, maxResults = 25 } = await request.json();

    if (!query || !source) {
      return NextResponse.json({ error: 'Query and source are required' }, { status: 400 });
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

    let results = [];

    try {
      switch (source) {
        case 'pubmed':
          results = await searchPubMed(query, maxResults);
          break;
        case 'clinicaltrials':
          results = await searchClinicalTrials(query, maxResults);
          break;
        case 'cochrane':
          results = await searchCochrane(query, maxResults);
          break;
        case 'embase':
          results = await searchEmbase(query, maxResults);
          break;
        default:
          return NextResponse.json({ error: 'Invalid data source' }, { status: 400 });
      }

      // Log the search action
      const auditLog = new AuditLog({
        projectId,
        userId: session.user.email,
        action: 'api_search_performed',
        details: { 
          source: source,
          query: query,
          resultCount: results.length
        },
      });

      await auditLog.save();

      return NextResponse.json(results);
    } catch (apiError) {
      console.error(`Error searching ${source}:`, apiError);
      return NextResponse.json({ 
        error: `Failed to search ${source}: ${apiError.message}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
