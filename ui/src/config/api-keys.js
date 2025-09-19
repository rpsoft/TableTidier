/**
 * API Keys and Configuration
 * Store API keys and configuration for external data sources
 */

export const API_CONFIG = {
  // PubMed/MEDLINE - No API key required
  pubmed: {
    enabled: true,
    requiresAuth: false,
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    rateLimit: 3, // requests per second
  },
  
  // ClinicalTrials.gov - No API key required
  clinicaltrials: {
    enabled: true,
    requiresAuth: false,
    baseUrl: 'https://clinicaltrials.gov/api/v2',
    rateLimit: 10, // requests per second
  },
  
  // Cochrane Library - Requires API key
  cochrane: {
    enabled: false, // Set to true when API key is configured
    requiresAuth: true,
    baseUrl: 'https://www.cochranelibrary.com/api',
    apiKey: process.env.COCHRANE_API_KEY || '',
    rateLimit: 5, // requests per second
  },
  
  // Embase - Requires Elsevier subscription and API key
  embase: {
    enabled: false, // Set to true when API key is configured
    requiresAuth: true,
    baseUrl: 'https://api.elsevier.com/content/embase',
    apiKey: process.env.EMBASE_API_KEY || '',
    rateLimit: 2, // requests per second
  }
};

export function isSourceEnabled(source) {
  return API_CONFIG[source]?.enabled || false;
}

export function getSourceConfig(source) {
  return API_CONFIG[source] || null;
}

export function getApiKey(source) {
  const config = getSourceConfig(source);
  return config?.apiKey || null;
}
