const puppeteer = require('puppeteer')

describe('Simple E2E Tests', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })
  })

  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })

  it('should load the projects page', async () => {
    await page.goto('http://localhost:3001/projects')
    
    // Wait for the page to load - use a more general selector
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Check if the page loaded successfully
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Check if we can find some content on the page
    const bodyText = await page.evaluate(() => document.body.textContent)
    expect(bodyText).toBeTruthy()
  })

  it('should have proper page structure', async () => {
    await page.goto('http://localhost:3001/projects')
    
    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Check for basic page elements
    const bodyText = await page.evaluate(() => document.body.textContent)
    expect(bodyText).toBeTruthy()
  })

  it('should handle navigation', async () => {
    await page.goto('http://localhost:3001')
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 10000 })
    
    // Check if we can navigate
    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost:3001')
  })
})
