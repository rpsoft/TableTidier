import { NextResponse } from 'next/server';
import { testPubMedPMID, testKnownPMID } from '@/lib/api/test-pubmed';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pmid = searchParams.get('pmid');
    
    if (pmid) {
      const result = await testPubMedPMID(pmid);
      return NextResponse.json(result);
    } else {
      // Test with a known good PMID
      const result = await testKnownPMID();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
