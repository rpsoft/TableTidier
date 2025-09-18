module.exports = async () => {
  // For now, just return without starting a server
  // E2E tests will run against the existing dev server
  console.log('E2E Global Setup: Using existing development server')
  return Promise.resolve()
}