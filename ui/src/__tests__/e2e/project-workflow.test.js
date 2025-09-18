const puppeteer = require('puppeteer')

describe('Project Workflow E2E Tests', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true', // Run headless in CI
      slowMo: 50, // Slow down operations for better visibility
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      protocolTimeout: 60000
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })
    
    // Mock authentication
    await page.evaluateOnNewDocument(() => {
      window.localStorage.setItem('nextauth.session', JSON.stringify({
        user: {
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }))
    })
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  describe('Project Creation Workflow', () => {
    it('should create a new project successfully', async () => {
      // Mock API responses
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        if (request.url().includes('/api/projects') && request.method() === 'POST') {
          request.respond({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-project-1',
              name: 'Test Systematic Review',
              description: 'A test project',
              researchQuestion: 'What is the effectiveness?',
              criteria: { inclusion: [], exclusion: [] },
              status: 'draft',
              createdBy: 'test@example.com',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          })
        } else if (request.url().includes('/api/projects') && request.method() === 'GET') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          })
        } else {
          request.continue()
        }
      })

      // Navigate to projects page
      await page.goto('http://localhost:3001/projects')
      await page.waitForSelector('h1')

      // Click "New Project" button
      await page.click('button:has-text("New Project")')
      await page.waitForSelector('form')

      // Fill in project details
      await page.type('input[placeholder="Enter project name"]', 'Test Systematic Review')
      await page.type('textarea[placeholder="Brief description of the systematic review"]', 'A test systematic review project')
      await page.type('textarea[placeholder="What is the main research question?"]', 'What is the effectiveness of intervention X?')
      await page.type('textarea[placeholder="Enter inclusion criteria (one per line)"]', 'Adults aged 18+\nRandomized controlled trials')
      await page.type('textarea[placeholder="Enter exclusion criteria (one per line)"]', 'Case reports\nAnimal studies')

      // Submit the form
      await page.click('button[type="submit"]')

      // Wait for redirect to project page
      await page.waitForURL(/\/projects\/test-project-1/)
      await page.waitForSelector('h1')

      // Verify project details are displayed
      expect(await page.textContent('h1')).toContain('Test Systematic Review')
      expect(await page.textContent('body')).toContain('A test systematic review project')
      expect(await page.textContent('body')).toContain('What is the effectiveness of intervention X?')
    })

    it('should show validation errors for missing required fields', async () => {
      // Mock API responses
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        if (request.url().includes('/api/projects') && request.method() === 'POST') {
          request.respond({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Project name is required' })
          })
        } else if (request.url().includes('/api/projects') && request.method() === 'GET') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          })
        } else {
          request.continue()
        }
      })

      // Navigate to projects page
      await page.goto('http://localhost:3001/projects')
      await page.waitForSelector('h1')

      // Click "New Project" button
      await page.click('button:has-text("New Project")')
      await page.waitForSelector('form')

      // Try to submit without filling required fields
      await page.click('button[type="submit"]')

      // Should show validation error
      await page.waitForSelector('input:invalid')
      expect(await page.$('input:invalid')).toBeTruthy()
    })
  })

  describe('Document Upload Workflow', () => {
    it('should upload a document successfully', async () => {
      // Mock API responses
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        if (request.url().includes('/api/projects/test-project-1/documents') && request.method() === 'POST') {
          request.respond({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-doc-1',
              fileName: 'test-document.html',
              metadata: {
                title: 'Test Research Article',
                authors: ['John Doe'],
                journal: 'Test Journal',
                year: 2024
              },
              status: 'uploaded',
              createdAt: new Date().toISOString()
            })
          })
        } else if (request.url().includes('/api/projects/test-project-1')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-project-1',
              name: 'Test Project',
              statistics: { totalDocuments: 0 }
            })
          })
        } else if (request.url().includes('/api/projects/test-project-1/documents') && request.method() === 'GET') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          })
        } else {
          request.continue()
        }
      })

      // Navigate to project page
      await page.goto('http://localhost:3001/projects/test-project-1')
      await page.waitForSelector('h1')

      // Click on Documents tab
      await page.click('button:has-text("Documents")')
      await page.waitForSelector('button:has-text("Upload Document")')

      // Click upload button
      await page.click('button:has-text("Upload Document")')
      await page.waitForSelector('[role="dialog"]')

      // Create a test HTML file
      const htmlContent = '<html><body><h1>Test Document</h1><table><tr><th>Header</th></tr><tr><td>Data</td></tr></table></body></html>'
      
      // Upload file
      const fileInput = await page.$('input[type="file"]')
      await fileInput.uploadFile({
        name: 'test-document.html',
        content: htmlContent,
        mimeType: 'text/html'
      })

      // Click upload button
      await page.click('button:has-text("Upload Document")')

      // Wait for upload to complete
      await page.waitForSelector('text="Test Research Article"', { timeout: 10000 })

      // Verify document appears in the list
      expect(await page.textContent('body')).toContain('Test Research Article')
      expect(await page.textContent('body')).toContain('John Doe')
    })

    it('should show error for invalid file type', async () => {
      // Navigate to project page
      await page.goto('http://localhost:3001/projects/test-project-1')
      await page.waitForSelector('h1')

      // Click on Documents tab
      await page.click('button:has-text("Documents")')
      await page.waitForSelector('button:has-text("Upload Document")')

      // Click upload button
      await page.click('button:has-text("Upload Document")')
      await page.waitForSelector('[role="dialog"]')

      // Try to upload a non-HTML file
      const fileInput = await page.$('input[type="file"]')
      await fileInput.uploadFile({
        name: 'test.txt',
        content: 'Not HTML content',
        mimeType: 'text/plain'
      })

      // Should show error message
      await page.waitForSelector('text="Please select an HTML file"')
      expect(await page.textContent('body')).toContain('Please select an HTML file')
    })
  })

  describe('Screening Workflow', () => {
    it('should allow screening decisions', async () => {
      // Mock API responses
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        if (request.url().includes('/api/projects/test-project-1/documents/test-doc-1/screening') && request.method() === 'POST') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Screening decision recorded successfully',
              screening: {
                userId: 'test@example.com',
                decision: 'included',
                reason: 'Meets inclusion criteria',
                timestamp: new Date().toISOString()
              }
            })
          })
        } else if (request.url().includes('/api/projects/test-project-1/documents/test-doc-1')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-doc-1',
              fileName: 'test-document.html',
              screening: [],
              metadata: { title: 'Test Document' }
            })
          })
        } else if (request.url().includes('/api/projects/test-project-1')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-project-1',
              name: 'Test Project',
              statistics: { totalDocuments: 1 }
            })
          })
        } else if (request.url().includes('/api/projects/test-project-1/documents') && request.method() === 'GET') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: 'test-doc-1',
              fileName: 'test-document.html',
              screening: [],
              metadata: { title: 'Test Document' }
            }])
          })
        } else {
          request.continue()
        }
      })

      // Navigate to project page
      await page.goto('http://localhost:3001/projects/test-project-1')
      await page.waitForSelector('h1')

      // Click on Documents tab
      await page.click('button:has-text("Documents")')
      await page.waitForSelector('a:has-text("View")')

      // Click on document
      await page.click('a:has-text("View")')
      await page.waitForSelector('h1')

      // Click on Screening tab
      await page.click('button:has-text("Screening")')
      await page.waitForSelector('input[type="radio"]')

      // Select "Include" decision
      await page.click('input[value="included"]')

      // Enter reason
      await page.type('textarea[placeholder="Enter reason for this decision..."]', 'Meets inclusion criteria')

      // Submit decision
      await page.click('button:has-text("Save Decision")')

      // Wait for success
      await page.waitForSelector('text="included"', { timeout: 5000 })

      // Verify decision is recorded
      expect(await page.textContent('body')).toContain('included')
      expect(await page.textContent('body')).toContain('Meets inclusion criteria')
    })
  })
})
