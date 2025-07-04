const axios = require('axios');

async function searchEuropePMCWithPMCLinks(query) {
  try {
    const url = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
    const params = {
      query: query,
      format: 'json',
      pageSize: 5,
      sort: 'cited desc',
      resultType: 'core'
    };

    const { data } = await axios.get(url, { params });

    const results = data.resultList.result;
    for (const article of results) {
      console.log('----------------------------------------');
      console.log(`Title: ${article.title}`);
      console.log(`Authors: ${article.authorString}`);
      console.log(`PubMed ID: ${article.pmid || 'N/A'}`);
      console.log(`PMCID: ${article.pmcid || 'N/A'}`);
      console.log(`In PMC: ${article.inPMC}`);
      console.log(`Open Access: ${article.isOpenAccess}`);
      console.log(`Has PDF: ${article.hasPDF}`);

      // debugger
      if (article.pmcid && article.inPMC === 'Y') {
        console.log(`Full Text HTML: https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/`);
        if (article.hasPDF === 'Y') {
          console.log(`Full Text PDF: https://www.ncbi.nlm.nih.gov/pmc/articles/${article.pmcid}/pdf/`);
        }
      } else {
        console.log('Full text link not available in PMC.');
      }
    }
  } catch (error) {
    console.error('Error fetching Europe PMC data:', error.message);
  }
}

// Search example for "autophagy"
searchEuropePMCWithPMCLinks('autophagy');
