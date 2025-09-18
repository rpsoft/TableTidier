// Ollama AI client for ontology integration and document analysis
const OLLAMA_BASE_URL = 'http://192.168.1.215:11434';
const MODEL_NAME = 'gpt-oss:latest';

export class OllamaClient {
  constructor() {
    this.baseUrl = OLLAMA_BASE_URL;
    this.model = MODEL_NAME;
  }

  async generateText(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            max_tokens: options.max_tokens || 1000,
            ...options
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  async extractConcepts(text) {
    const prompt = `Extract medical and scientific concepts from the following text. Return a JSON array of objects with the following structure:
    [
      {
        "concept": "concept name",
        "type": "medical/scientific/statistical",
        "confidence": 0.0-1.0,
        "context": "brief context where it appears"
      }
    ]
    
    Text: ${text}
    
    Focus on:
    - Medical conditions, treatments, interventions
    - Study designs, methodologies
    - Statistical measures, outcomes
    - Populations, demographics
    - Risk factors, comorbidities
    
    Return only valid JSON:`;

    try {
      const response = await this.generateText(prompt, { temperature: 0.3 });
      // Clean up the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error extracting concepts:', error);
      return [];
    }
  }

  async mapToOntology(concept, ontologyType = 'UMLS') {
    const prompt = `Map the following concept to ${ontologyType} ontology. Return a JSON object with:
    {
      "concept": "original concept",
      "mappedConcept": {
        "id": "ontology ID",
        "name": "standardized name",
        "definition": "definition",
        "semanticType": "semantic type",
        "synonyms": ["synonym1", "synonym2"],
        "confidence": 0.0-1.0
      },
      "reasoning": "brief explanation of mapping"
    }
    
    Concept: ${concept}
    
    Focus on medical and scientific terminology. Return only valid JSON:`;

    try {
      const response = await this.generateText(prompt, { temperature: 0.2 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error mapping to ontology:', error);
      return null;
    }
  }

  async analyzeDocument(document) {
    const prompt = `Analyze this systematic review document and provide insights. Return a JSON object with:
    {
      "summary": {
        "studyType": "RCT/Cohort/Case-Control/etc",
        "population": "brief description",
        "intervention": "brief description",
        "outcome": "brief description",
        "quality": "high/medium/low"
      },
      "keyFindings": ["finding1", "finding2", "finding3"],
      "limitations": ["limitation1", "limitation2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
    
    Document title: ${document.metadata?.title || 'Unknown'}
    Abstract: ${document.metadata?.abstract || 'No abstract available'}
    
    Return only valid JSON:`;

    try {
      const response = await this.generateText(prompt, { temperature: 0.4 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error analyzing document:', error);
      return null;
    }
  }

  async generateSuggestions(project, documents) {
    const prompt = `Based on this systematic review project, provide suggestions for improvement. Return a JSON object with:
    {
      "searchStrategy": ["suggestion1", "suggestion2"],
      "inclusionCriteria": ["suggestion1", "suggestion2"],
      "dataExtraction": ["suggestion1", "suggestion2"],
      "qualityAssessment": ["suggestion1", "suggestion2"],
      "overall": ["suggestion1", "suggestion2"]
    }
    
    Project: ${project.name}
    Research Question: ${project.researchQuestion || 'Not specified'}
    Documents: ${documents.length}
    Included: ${documents.filter(d => d.screening?.[d.screening.length - 1]?.decision === 'included').length}
    
    Return only valid JSON:`;

    try {
      const response = await this.generateText(prompt, { temperature: 0.6 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return null;
    }
  }

  async chat(message, context = '') {
    const prompt = `You are an AI research assistant for systematic reviews. Help with the following question.
    
    Context: ${context}
    
    Question: ${message}
    
    Provide a helpful, accurate response focused on systematic review methodology, evidence synthesis, and research best practices.`;

    try {
      const response = await this.generateText(prompt, { temperature: 0.7 });
      return response;
    } catch (error) {
      console.error('Error in chat:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }
}

export const ollamaClient = new OllamaClient();
