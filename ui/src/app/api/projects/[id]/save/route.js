import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ProjectUser } from '@/database/projectUser.model';
import { Project } from '@/database/project.model';
import { Document } from '@/database/document.model';

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { data, type } = await request.json();

    if (!data || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has access to this project
    const projectUser = await ProjectUser.findOne({
      projectId,
      userId: session.user.email,
    });

    if (!projectUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let result;

    switch (type) {
      case 'project':
        result = await Project.findByIdAndUpdate(projectId, data, { new: true });
        break;
        
      case 'document':
        const { documentId, ...documentData } = data;
        result = await Document.findByIdAndUpdate(documentId, documentData, { new: true });
        break;
        
      case 'screening':
        const { docId, screeningData } = data;
        result = await Document.findByIdAndUpdate(
          docId,
          { 
            $push: { screening: screeningData },
            updatedAt: new Date().toISOString()
          },
          { new: true }
        );
        break;
        
      case 'extraction':
        const { documentId: extDocId, extractedData } = data;
        result = await Document.findByIdAndUpdate(
          extDocId,
          { 
            extractedData,
            updatedAt: new Date().toISOString()
          },
          { new: true }
        );
        break;
        
      case 'quality_assessment':
        const { documentId: qaDocId, qualityAssessment } = data;
        result = await Document.findByIdAndUpdate(
          qaDocId,
          { 
            qualityAssessment,
            updatedAt: new Date().toISOString()
          },
          { new: true }
        );
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
