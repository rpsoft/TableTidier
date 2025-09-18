// E2E test setup
beforeEach(async () => {
  // Clear any existing data or state
  if (global.page) {
    await global.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }
})

afterEach(async () => {
  // Clean up any open pages
  if (global.page) {
    await global.page.close()
    global.page = null
  }
})