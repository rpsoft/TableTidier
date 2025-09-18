const { join } = require('path')

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  // Puppeteer will use this executable path instead of the bundled Chromium
  // executablePath: '/usr/bin/chromium-browser',
}
