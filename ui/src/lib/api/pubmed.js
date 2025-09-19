/**
 * PubMed/MEDLINE API integration
 * Uses NCBI E-utilities API (free, no authentication required)
 */

const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(query, maxResults = 25) {
  try {
    console.log(`Searching PubMed for: "${query}" with max results: ${maxResults}`);
    
    // Step 1: Search for PMIDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    console.log('Search response:', searchData);
    
    if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
      console.log('No search results found');
      return [];
    }

    const pmids = searchData.esearchresult.idlist;
    console.log(`Found ${pmids.length} PMIDs:`, pmids);
    
    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch detailed information for each PMID
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract`;
    console.log('Fetch URL:', fetchUrl);
    
    const fetchResponse = await fetch(fetchUrl);
    const xmlData = await fetchResponse.text();
    
    console.log(`Received XML data length: ${xmlData.length}`);
    
    // Parse XML response
    const results = parsePubMedXML(xmlData);
    console.log(`Parsed ${results.length} results from search`);
    
    return results;
  } catch (error) {
    console.error('PubMed search error:', error);
    throw new Error(`PubMed search failed: ${error.message}`);
  }
}

export async function acquirePubMedDocument(pmid) {
  try {
    console.log(`Attempting to acquire PubMed document with PMID: ${pmid}`);
    
    // Validate PMID format
    if (!pmid || !/^\d+$/.test(pmid)) {
      throw new Error(`Invalid PMID format: ${pmid}`);
    }
    
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`;
    console.log('Fetch URL:', fetchUrl);
    
    const response = await fetch(fetchUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlData = await response.text();
    console.log(`Received XML data length: ${xmlData.length}`);
    
    // Check if the response contains an error
    if (xmlData.includes('<ERROR>')) {
      console.log('XML response contains error:', xmlData);
      const errorMatch = xmlData.match(/<ERROR>(.*?)<\/ERROR>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'Unknown error';
      throw new Error(`PubMed API error for PMID ${pmid}: ${errorMessage}`);
    }
    
    // Check if the response is empty or invalid
    if (xmlData.length < 100) {
      throw new Error(`PubMed API returned empty or invalid response for PMID ${pmid}`);
    }
    
    const results = parsePubMedXML(xmlData);
    console.log(`Parsed ${results.length} results from XML`);
    
    if (results.length === 0) {
      // Try to get more details about why no results were found
      if (xmlData.includes('No items found') || xmlData.includes('No results found')) {
        throw new Error(`Document with PMID ${pmid} not found in PubMed database`);
      } else if (xmlData.includes('Invalid PMID')) {
        throw new Error(`Invalid PMID: ${pmid}`);
      } else {
        console.log('XML content for debugging:', xmlData.substring(0, 1000));
        throw new Error(`Document with PMID ${pmid} could not be parsed. XML length: ${xmlData.length}`);
      }
    }

    const document = results[0];
    console.log(`Successfully acquired document: ${document.title}`);
    
    // Convert to HTML format for processing
    const htmlContent = generatePubMedHTML(document);
    
    return {
      title: document.title,
      authors: document.authors,
      journal: document.journal,
      year: document.year,
      doi: document.doi,
      abstract: document.abstract,
      keywords: document.keywords,
      pmid: document.pmid,
      content: htmlContent,
      text: extractTextSections(document),
      tables: [] // PubMed abstracts typically don't contain tables
    };
  } catch (error) {
    console.error('PubMed acquisition error:', error);
    throw new Error(`Failed to acquire PubMed document: ${error.message}`);
  }
}

function parsePubMedXML(xmlData) {
  // This is a simplified XML parser for PubMed data
  // In a production environment, you'd want to use a proper XML parser like xml2js
  
  console.log('Starting XML parsing...');
  
  // Check if we have valid XML data
  if (!xmlData || xmlData.length < 100) {
    console.log('Invalid or empty XML data received');
    return [];
  }
  
  const results = [];
  const articles = xmlData.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  
  console.log(`Found ${articles.length} articles in XML`);
  
  // If no articles found, try alternative patterns
  if (articles.length === 0) {
    console.log('No PubmedArticle tags found, trying alternative patterns...');
    // Try to find any article-like content
    const altArticles = xmlData.match(/<Article>[\s\S]*?<\/Article>/g) || [];
    console.log(`Found ${altArticles.length} alternative article patterns`);
    
    if (altArticles.length === 0) {
      console.log('No article patterns found in XML');
      console.log('XML sample:', xmlData.substring(0, 500));
      return [];
    }
  }
  
  for (const article of articles) {
    try {
      const pmid = extractValue(article, 'PMID');
      const title = extractValue(article, 'ArticleTitle');
      const abstract = extractValue(article, 'AbstractText');
      const journal = extractValue(article, 'Journal/Title') || extractValue(article, 'MedlineTA');
      const year = extractValue(article, 'PubDate/Year') || extractValue(article, 'PubDate/MedlineDate');
      const doi = extractValue(article, 'ELocationID[@EIdType="doi"]');
      
      console.log(`Parsing article - PMID: ${pmid}, Title: ${title ? title.substring(0, 50) + '...' : 'No title'}`);
      
      // Extract authors
      const authors = [];
      const authorMatches = article.match(/<Author[\s\S]*?<\/Author>/g) || [];
      for (const authorMatch of authorMatches) {
        const lastName = extractValue(authorMatch, 'LastName');
        const foreName = extractValue(authorMatch, 'ForeName');
        if (lastName) {
          authors.push(foreName ? `${foreName} ${lastName}` : lastName);
        }
      }
      
      // Extract keywords
      const keywords = [];
      const keywordMatches = article.match(/<Keyword[\s\S]*?<\/Keyword>/g) || [];
      for (const keywordMatch of keywordMatches) {
        const keyword = extractValue(keywordMatch, 'Keyword');
        if (keyword) {
          keywords.push(keyword);
        }
      }
      
      if (pmid && title) {
        results.push({
          id: pmid,
          pmid,
          title: cleanText(title),
          authors,
          journal: cleanText(journal),
          year: year ? parseInt(year) : null,
          doi,
          abstract: cleanText(abstract),
          keywords
        });
        console.log(`Successfully parsed article with PMID: ${pmid}`);
      } else {
        console.log(`Skipping article - missing PMID or title. PMID: ${pmid}, Title: ${title}`);
      }
    } catch (error) {
      console.error('Error parsing PubMed article:', error);
      console.log('Article XML sample:', article.substring(0, 200));
    }
  }
  
  console.log(`Successfully parsed ${results.length} articles`);
  return results;
}

function extractValue(xml, path) {
  const regex = new RegExp(`<${path}[^>]*>([\\s\\S]*?)<\\/${path}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function cleanText(text) {
  if (!text) return '';
  
  // First decode HTML entities
  let cleaned = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&lsquo;/g, '\'')
    .replace(/&rsquo;/g, '\'')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&bull;/g, '•')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');
  
  // Decode numeric HTML entities (hex and decimal)
  cleaned = cleaned.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  cleaned = cleaned.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Clean up any remaining HTML entities
  cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, '');
  
  return cleaned.trim();
}

function generatePubMedHTML(document) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${document.title}</title>
    <meta charset="UTF-8">
</head>
<body>
    <article>
        <header>
            <h1>${document.title}</h1>
            <div class="authors">
                <strong>Authors:</strong> ${document.authors.join(', ')}
            </div>
            <div class="journal">
                <strong>Journal:</strong> ${document.journal || 'N/A'}
            </div>
            <div class="year">
                <strong>Year:</strong> ${document.year || 'N/A'}
            </div>
            ${document.doi ? `<div class="doi"><strong>DOI:</strong> ${document.doi}</div>` : ''}
            ${document.pmid ? `<div class="pmid"><strong>PMID:</strong> ${document.pmid}</div>` : ''}
        </header>
        
        ${document.abstract ? `
        <section class="abstract">
            <h2>Abstract</h2>
            <p>${document.abstract}</p>
        </section>
        ` : ''}
        
        ${document.keywords && document.keywords.length > 0 ? `
        <section class="keywords">
            <h2>Keywords</h2>
            <p><strong>Keywords:</strong> ${document.keywords.join(', ')}</p>
        </section>
        ` : ''}
    </article>
</body>
</html>`;
}

function extractTextSections(document) {
  const sections = [];
  
  if (document.abstract) {
    sections.push({
      section: 'abstract',
      content: document.abstract,
      highlights: []
    });
  }
  
  return sections;
}
