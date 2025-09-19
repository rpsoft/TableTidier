/**
 * ClinicalTrials.gov API integration
 * Uses REST API v2.0 (free, no authentication required)
 */

const CLINICALTRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2';

export async function searchClinicalTrials(query, maxResults = 25) {
  try {
    const searchUrl = `${CLINICALTRIALS_BASE_URL}/studies?query=${encodeURIComponent(query)}&format=json&pageSize=${maxResults}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!data.studies || !Array.isArray(data.studies)) {
      return [];
    }

    return data.studies.map(study => ({
      id: study.protocolSection.identificationModule.nctId,
      nctId: study.protocolSection.identificationModule.nctId,
      title: cleanText(study.protocolSection.identificationModule.briefTitle),
      description: cleanText(study.protocolSection.identificationModule.briefSummary?.textBlock?.text),
      status: study.protocolSection.statusModule.overallStatus,
      phase: study.protocolSection.designModule.phases?.join(', ') || 'N/A',
      studyType: study.protocolSection.designModule.studyType,
      conditions: study.protocolSection.conditionsModule.conditions?.map(c => cleanText(c)) || [],
      interventions: study.protocolSection.armsInterventionsModule?.interventions?.map(i => cleanText(i.name)) || [],
      locations: study.protocolSection.contactsLocationsModule?.locations?.map(l => cleanText(l.facility?.name)).filter(Boolean) || [],
      sponsors: cleanText(study.protocolSection.sponsorCollaboratorsModule?.leadSponsor?.name) || 'N/A',
      startDate: study.protocolSection.statusModule.startDateStruct?.date,
      completionDate: study.protocolSection.statusModule.completionDateStruct?.date,
      enrollment: study.protocolSection.statusModule.enrollment?.value,
      primaryOutcome: study.protocolSection.outcomesModule?.primaryOutcomes?.map(o => cleanText(o.measure)) || [],
      secondaryOutcome: study.protocolSection.outcomesModule?.secondaryOutcomes?.map(o => cleanText(o.measure)) || []
    }));
  } catch (error) {
    console.error('ClinicalTrials.gov search error:', error);
    throw new Error(`ClinicalTrials.gov search failed: ${error.message}`);
  }
}

export async function acquireClinicalTrialDocument(nctId) {
  try {
    const fetchUrl = `${CLINICALTRIALS_BASE_URL}/studies/${nctId}?format=json`;
    
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    if (!data.protocolSection) {
      throw new Error(`Clinical trial with NCT ID ${nctId} not found`);
    }

    const study = data;
    const identification = study.protocolSection.identificationModule;
    const status = study.protocolSection.statusModule;
    const design = study.protocolSection.designModule;
    const conditions = study.protocolSection.conditionsModule;
    const interventions = study.protocolSection.armsInterventionsModule;
    const outcomes = study.protocolSection.outcomesModule;
    const eligibility = study.protocolSection.eligibilityModule;
    const contacts = study.protocolSection.contactsLocationsModule;
    const sponsor = study.protocolSection.sponsorCollaboratorsModule;
    
    // Generate HTML content
    const htmlContent = generateClinicalTrialHTML(study);
    
    return {
      title: cleanText(identification.briefTitle),
      nctId: identification.nctId,
      description: cleanText(identification.briefSummary?.textBlock?.text),
      status: status.overallStatus,
      phase: design.phases?.join(', ') || 'N/A',
      studyType: design.studyType,
      conditions: conditions.conditions?.map(c => cleanText(c)) || [],
      interventions: interventions?.interventions?.map(i => cleanText(i.name)) || [],
      locations: contacts?.locations?.map(l => cleanText(l.facility?.name)).filter(Boolean) || [],
      sponsors: cleanText(sponsor?.leadSponsor?.name) || 'N/A',
      startDate: status.startDateStruct?.date,
      completionDate: status.completionDateStruct?.date,
      enrollment: status.enrollment?.value,
      primaryOutcome: outcomes?.primaryOutcomes?.map(o => cleanText(o.measure)) || [],
      secondaryOutcome: outcomes?.secondaryOutcomes?.map(o => cleanText(o.measure)) || [],
      eligibility: cleanText(eligibility?.eligibilityCriteria?.textBlock?.text),
      content: htmlContent,
      text: extractTextSections(study),
      tables: [] // ClinicalTrials.gov data is structured but not in table format
    };
  } catch (error) {
    console.error('ClinicalTrials.gov acquisition error:', error);
    throw new Error(`Failed to acquire ClinicalTrials.gov document: ${error.message}`);
  }
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

function generateClinicalTrialHTML(study) {
  const identification = study.protocolSection.identificationModule;
  const status = study.protocolSection.statusModule;
  const design = study.protocolSection.designModule;
  const conditions = study.protocolSection.conditionsModule;
  const interventions = study.protocolSection.armsInterventionsModule;
  const outcomes = study.protocolSection.outcomesModule;
  const eligibility = study.protocolSection.eligibilityModule;
  const contacts = study.protocolSection.contactsLocationsModule;
  const sponsor = study.protocolSection.sponsorCollaboratorsModule;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>${identification.briefTitle}</title>
    <meta charset="UTF-8">
</head>
<body>
    <article>
        <header>
            <h1>${cleanText(identification.briefTitle)}</h1>
            <div class="nct-id">
                <strong>NCT ID:</strong> ${identification.nctId}
            </div>
            <div class="status">
                <strong>Status:</strong> ${status.overallStatus}
            </div>
            <div class="phase">
                <strong>Phase:</strong> ${design.phases?.join(', ') || 'N/A'}
            </div>
            <div class="study-type">
                <strong>Study Type:</strong> ${design.studyType}
            </div>
        </header>
        
        ${identification.briefSummary?.textBlock?.text ? `
        <section class="summary">
            <h2>Brief Summary</h2>
            <p>${cleanText(identification.briefSummary.textBlock.text)}</p>
        </section>
        ` : ''}
        
        ${conditions.conditions && conditions.conditions.length > 0 ? `
        <section class="conditions">
            <h2>Conditions</h2>
            <ul>
                ${conditions.conditions.map(condition => `<li>${cleanText(condition)}</li>`).join('')}
            </ul>
        </section>
        ` : ''}
        
        ${interventions?.interventions && interventions.interventions.length > 0 ? `
        <section class="interventions">
            <h2>Interventions</h2>
            <ul>
                ${interventions.interventions.map(intervention => `
                    <li>
                        <strong>${cleanText(intervention.name)}</strong>
                        ${intervention.description ? `<br><em>${cleanText(intervention.description)}</em>` : ''}
                    </li>
                `).join('')}
            </ul>
        </section>
        ` : ''}
        
        ${outcomes?.primaryOutcomes && outcomes.primaryOutcomes.length > 0 ? `
        <section class="primary-outcomes">
            <h2>Primary Outcomes</h2>
            <ul>
                ${outcomes.primaryOutcomes.map(outcome => `<li>${cleanText(outcome.measure)}</li>`).join('')}
            </ul>
        </section>
        ` : ''}
        
        ${outcomes?.secondaryOutcomes && outcomes.secondaryOutcomes.length > 0 ? `
        <section class="secondary-outcomes">
            <h2>Secondary Outcomes</h2>
            <ul>
                ${outcomes.secondaryOutcomes.map(outcome => `<li>${cleanText(outcome.measure)}</li>`).join('')}
            </ul>
        </section>
        ` : ''}
        
        ${eligibility?.eligibilityCriteria?.textBlock?.text ? `
        <section class="eligibility">
            <h2>Eligibility Criteria</h2>
            <p>${cleanText(eligibility.eligibilityCriteria.textBlock.text)}</p>
        </section>
        ` : ''}
        
        <section class="study-details">
            <h2>Study Details</h2>
            <div class="details-grid">
                <div><strong>Start Date:</strong> ${status.startDateStruct?.date || 'N/A'}</div>
                <div><strong>Completion Date:</strong> ${status.completionDateStruct?.date || 'N/A'}</div>
                <div><strong>Enrollment:</strong> ${status.enrollment?.value || 'N/A'}</div>
                <div><strong>Lead Sponsor:</strong> ${cleanText(sponsor?.leadSponsor?.name) || 'N/A'}</div>
            </div>
        </section>
        
        ${contacts?.locations && contacts.locations.length > 0 ? `
        <section class="locations">
            <h2>Study Locations</h2>
            <ul>
                ${contacts.locations.map(location => `
                    <li>
                        ${cleanText(location.facility?.name) || 'Unknown Facility'}
                        ${location.facility?.city ? `, ${cleanText(location.facility.city)}` : ''}
                        ${location.facility?.state ? `, ${cleanText(location.facility.state)}` : ''}
                        ${location.facility?.country ? `, ${cleanText(location.facility.country)}` : ''}
                    </li>
                `).join('')}
            </ul>
        </section>
        ` : ''}
    </article>
</body>
</html>`;
}

function extractTextSections(study) {
  const sections = [];
  
  const identification = study.protocolSection.identificationModule;
  const outcomes = study.protocolSection.outcomesModule;
  const eligibility = study.protocolSection.eligibilityModule;
  
  if (identification.briefSummary?.textBlock?.text) {
    sections.push({
      section: 'summary',
      content: cleanText(identification.briefSummary.textBlock.text),
      highlights: []
    });
  }
  
  if (outcomes?.primaryOutcomes && outcomes.primaryOutcomes.length > 0) {
    sections.push({
      section: 'primary_outcomes',
      content: outcomes.primaryOutcomes.map(o => cleanText(o.measure)).join('\n'),
      highlights: []
    });
  }
  
  if (outcomes?.secondaryOutcomes && outcomes.secondaryOutcomes.length > 0) {
    sections.push({
      section: 'secondary_outcomes',
      content: outcomes.secondaryOutcomes.map(o => cleanText(o.measure)).join('\n'),
      highlights: []
    });
  }
  
  if (eligibility?.eligibilityCriteria?.textBlock?.text) {
    sections.push({
      section: 'eligibility',
      content: cleanText(eligibility.eligibilityCriteria.textBlock.text),
      highlights: []
    });
  }
  
  return sections;
}
