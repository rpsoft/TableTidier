import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { projectId, format, dataType, filters = {} } = await request.json();

    if (!projectId || !format || !dataType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Export request:', { projectId, format, dataType, filters });

    // For now, return mock data to test the export functionality
    const mockData = [
      {
        id: 'doc1',
        title: 'Sample Document 1',
        authors: 'John Doe, Jane Smith',
        journal: 'Sample Journal',
        year: '2023',
        abstract: 'This is a sample abstract for testing export functionality.',
        screeningDecision: 'included',
        screeningNotes: 'Meets inclusion criteria',
        uploadedAt: new Date().toISOString(),
        fileSize: 1024,
        fileType: 'pdf'
      },
      {
        id: 'doc2',
        title: 'Sample Document 2',
        authors: 'Alice Johnson, Bob Wilson',
        journal: 'Another Journal',
        year: '2023',
        abstract: 'Another sample abstract for testing.',
        screeningDecision: 'excluded',
        screeningNotes: 'Does not meet inclusion criteria',
        uploadedAt: new Date().toISOString(),
        fileSize: 2048,
        fileType: 'pdf'
      }
    ];

    // Generate file based on format
    let fileContent = '';
    let mimeType = '';
    let fileName = `project_${dataType}_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        fileContent = convertToCSV(mockData);
        mimeType = 'text/csv';
        fileName += '.csv';
        break;
        
      case 'json':
        fileContent = JSON.stringify(mockData, null, 2);
        mimeType = 'application/json';
        fileName += '.json';
        break;
        
      case 'xlsx':
        // For XLSX, we'll return a JSON structure that can be converted client-side
        fileContent = JSON.stringify({
          data: mockData,
          metadata: {
            project: 'Test Project',
            exportDate: new Date().toISOString(),
            recordCount: mockData.length,
            dataType: dataType
          }
        });
        mimeType = 'application/json';
        fileName += '.xlsx';
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: fileContent,
        mimeType,
        fileName,
        size: fileContent.length,
        recordCount: mockData.length
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function for CSV conversion
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}