const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Read environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
  console.error("Missing required environment variables: GITHUB_TOKEN, REPO_OWNER, or REPO_NAME");
  process.exit(1);
}

// Function to scan for files in a directory
function scanComments(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanComments(fullPath); // Recursively scan subdirectories
    } else if (isJavaScriptFile(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      processComments(content);
    }
  });
}

// Function to determine if a file is JavaScript-like
function isJavaScriptFile(filePath) {
  const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
  return validExtensions.some((ext) => filePath.endsWith(ext));
}

// Function to process comments in a file
function processComments(content) {
  const lines = content.split('\n');

  lines.forEach(async (line) => {
    // Match CREATE-ISSUE
    if (line.includes('// CREATE-ISSUE')) {
      const titleMatch = line.match(/Title="([^"]*)"/);
      const descriptionMatch = line.match(/Description="([^"]*)"/);

      if (titleMatch && descriptionMatch) {
        const title = titleMatch[1];
        const description = descriptionMatch[1];

        console.log(`Checking if issue exists: ${title}`);
        const issueExists = await checkIfIssueExists(title);
        if (!issueExists) {
          console.log(`Creating issue: ${title}`);
          await createGitHubIssue(title, description);
        } else {
          console.log(`Issue already exists: ${title}`);
        }
      }
    }

    // Match CLOSE-ISSUE
    if (line.includes('// CLOSE-ISSUE')) {
      const issueIdMatch = line.match(/IssueID=(\d+)/);
      if (issueIdMatch) {
        const issueId = issueIdMatch[1];
        console.log(`Closing issue: ${issueId}`);
        await closeGitHubIssue(issueId);
      }
    }
  });
}

// Function to check if an issue with the same title already exists (checks both open and closed issues)
async function checkIfIssueExists(title) {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: {
          state: 'all', // Check both open and closed issues
          per_page: 100, // Fetch up to 100 issues per page
        },
      }
    );

    // Check if any issue has the same title
    return response.data.some((issue) => issue.title === title);
  } catch (error) {
    console.error(`Error checking issues: ${error.message}`);
    return false;
  }
}

// Function to create a GitHub issue
async function createGitHubIssue(title, description) {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      { title, body: description },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    console.log(`Issue created: ${response.data.html_url}`);
  } catch (error) {
    console.error(`Error creating issue: ${error.message}`);
  }
}

// Function to close a GitHub issue
async function closeGitHubIssue(issueId) {
  try {
    const response = await axios.patch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueId}`,
      { state: 'closed' },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    console.log(`Issue closed: ${response.data.html_url}`);
  } catch (error) {
    console.error(`Error closing issue: ${error.message}`);
  }
}

// Start scanning the current directory
scanComments(process.cwd());
