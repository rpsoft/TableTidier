const { JSDOM } = require('jsdom');

// Test HTML content with tables
const testHTML = `
<!DOCTYPE html>
<html>
<head><title>Test Document</title></head>
<body>
    <h1>Test Document</h1>
    <p>This is a test document with tables.</p>
    
    <table border="1">
        <caption>Test Table 1</caption>
        <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
        </thead>
        <tbody>
            <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
    </table>
    
    <table border="1">
        <thead>
            <tr><th>Header A</th><th>Header B</th></tr>
        </thead>
        <tbody>
            <tr><td>Data A</td><td>Data B</td></tr>
        </tbody>
    </table>
</body>
</html>
`;

// Function to extract tables from HTML content using jsdom
function extractTablesFromHTMLServer(htmlContent) {
  const tables = [];
  
  try {
    console.log('Creating JSDOM instance...');
    // Create a DOM from the HTML content
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    console.log('Finding table elements...');
    // Find all table elements
    const tableElements = document.querySelectorAll('table');
    console.log(`Found ${tableElements.length} tables`);
    
    tableElements.forEach((table, index) => {
      // Get the outer HTML of the table
      const tableHTML = table.outerHTML;
      
      // Create a meaningful filename based on table content or position
      let fileName = `table_${index + 1}.html`;
      
      // Try to find a caption or title for the table
      const caption = table.querySelector('caption');
      if (caption && caption.textContent.trim()) {
        const captionText = caption.textContent.trim().replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        fileName = `${captionText}_table_${index + 1}.html`;
      }
      
      console.log(`Processing table ${index + 1}: ${fileName}`);
      tables.push({
        htmlContent: tableHTML,
        fileName: fileName,
      });
    });
    
  } catch (error) {
    console.error('Error parsing HTML with jsdom:', error);
    // Fallback to regex method if jsdom fails
    return extractTablesFromHTMLRegex(htmlContent);
  }
  
  return tables;
}

// Fallback function using regex (less reliable but works as backup)
function extractTablesFromHTMLRegex(htmlContent) {
  console.log('Using regex fallback...');
  const tables = [];
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  let match;
  let index = 1;
  
  while ((match = tableRegex.exec(htmlContent)) !== null) {
    tables.push({
      htmlContent: match[0],
      fileName: `table_${index}.html`,
    });
    index++;
  }
  
  return tables;
}

// Test the extraction
console.log('Testing table extraction...');
const extractedTables = extractTablesFromHTMLServer(testHTML);
console.log(`Extracted ${extractedTables.length} tables:`);
extractedTables.forEach((table, index) => {
  console.log(`  ${index + 1}. ${table.fileName} (${table.htmlContent.length} chars)`);
}); 