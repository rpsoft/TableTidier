/**
 * Test function to verify HTML entity decoding
 */

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

// Test cases
const testCases = [
  {
    input: "Hydroxypropyl&#x2011;&#x3b2;&#x2011;cyclodextrin/thymoquinone inclusion complex inhibits non&#x2011;small cell lung cancer progression through NF&#x2011;&#x3ba;B&#x2011;mediated ferroptosis.",
    expected: "Hydroxypropyl-β-cyclodextrin/thymoquinone inclusion complex inhibits non-small cell lung cancer progression through NF-κB-mediated ferroptosis."
  },
  {
    input: "This is a test with &amp; ampersand and &lt; less than &gt; greater than.",
    expected: "This is a test with & ampersand and < less than > greater than."
  },
  {
    input: "Special characters: &ndash; &mdash; &hellip; &lsquo; &rsquo; &ldquo; &rdquo;",
    expected: "Special characters: – — … ' ' " " "
  },
  {
    input: "Numeric entities: &#x3b1; &#x3b2; &#x3b3; &#65; &#66; &#67;",
    expected: "Numeric entities: α β γ A B C"
  }
];

console.log('Testing HTML entity decoding...\n');

testCases.forEach((testCase, index) => {
  const result = cleanText(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`Input:    ${testCase.input}`);
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Result:   ${result}`);
  console.log('---');
});

export { cleanText };
