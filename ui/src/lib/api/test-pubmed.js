/**
 * Test function to verify PubMed API functionality
 */

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function testPubMedPMID(pmid) {
  try {
    console.log(`Testing PMID: ${pmid}`);
    
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;
    console.log('Fetch URL:', fetchUrl);
    
    const response = await fetch(fetchUrl);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const xmlData = await response.text();
    console.log('XML data length:', xmlData.length);
    console.log('XML data preview:', xmlData.substring(0, 500));
    
    // Check for errors in the response
    if (xmlData.includes('<ERROR>')) {
      console.log('Error found in XML response');
      const errorMatch = xmlData.match(/<ERROR>(.*?)<\/ERROR>/);
      if (errorMatch) {
        console.log('Error message:', errorMatch[1]);
      }
    }
    
    // Check if we have any articles
    const articleCount = (xmlData.match(/<PubmedArticle>/g) || []).length;
    console.log('Number of articles found:', articleCount);
    
    return {
      success: response.ok,
      status: response.status,
      xmlLength: xmlData.length,
      articleCount: articleCount,
      hasError: xmlData.includes('<ERROR>'),
      preview: xmlData.substring(0, 500)
    };
  } catch (error) {
    console.error('Test error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test with a known good PMID
export async function testKnownPMID() {
  // This is a known good PMID from 2024
  return await testPubMedPMID('40970355');
}
