module.exports = async () => {
  // Clean up any global resources
  console.log('E2E Global Teardown: Cleanup completed')
  return Promise.resolve()
}