import { NextResponse } from 'next/server';
import { cleanText } from '@/lib/api/test-html-entities';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    
    if (text) {
      const cleaned = cleanText(text);
      return NextResponse.json({
        original: text,
        cleaned: cleaned,
        success: true
      });
    } else {
      // Test with the example from the user
      const testText = "Hydroxypropyl&#x2011;&#x3b2;&#x2011;cyclodextrin/thymoquinone inclusion complex inhibits non&#x2011;small cell lung cancer progression through NF&#x2011;&#x3ba;B&#x2011;mediated ferroptosis.";
      const cleaned = cleanText(testText);
      
      return NextResponse.json({
        original: testText,
        cleaned: cleaned,
        expected: "Hydroxypropyl-β-cyclodextrin/thymoquinone inclusion complex inhibits non-small cell lung cancer progression through NF-κB-mediated ferroptosis.",
        success: true
      });
    }
  } catch (error) {
    console.error('HTML entity test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
