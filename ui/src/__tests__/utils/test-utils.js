import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock data for testing
export const mockProject = {
  id: 'test-project-1',
  name: 'Test Systematic Review',
  description: 'A test systematic review project',
  researchQuestion: 'What is the effectiveness of intervention X?',
  criteria: {
    inclusion: ['Adults aged 18+', 'Randomized controlled trials'],
    exclusion: ['Case reports', 'Animal studies']
  },
  status: 'active',
  createdBy: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  statistics: {
    totalDocuments: 5,
    screenedDocuments: 3,
    includedDocuments: 2,
    excludedDocuments: 1
  },
  teamMembers: [
    {
      userId: 'test@example.com',
      role: 'admin',
      assignedAt: '2024-01-01T00:00:00Z'
    }
  ]
}

export const mockDocument = {
  id: 'test-doc-1',
  projectId: 'test-project-1',
  fileName: 'test-document.html',
  metadata: {
    title: 'Test Research Article',
    authors: ['John Doe', 'Jane Smith'],
    journal: 'Test Journal',
    year: 2024,
    doi: '10.1000/test',
    abstract: 'This is a test abstract for the research article.',
    keywords: ['test', 'research', 'systematic review']
  },
  text: [
    {
      section: 'abstract',
      content: 'This is a test abstract for the research article.',
      highlights: []
    }
  ],
  tables: [
    {
      id: 'table-1',
      headers: [['Intervention', 'Outcome', 'Sample Size']],
      rows: [
        ['Treatment A', 'Improved', '100'],
        ['Treatment B', 'No Change', '95']
      ],
      annotations: {
        columns: {},
        rows: {}
      },
      htmlContent: '<table><tr><th>Intervention</th><th>Outcome</th><th>Sample Size</th></tr><tr><td>Treatment A</td><td>Improved</td><td>100</td></tr></table>'
    }
  ],
  screening: [],
  extractedData: [],
  status: 'uploaded',
  uploadedBy: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  departmentIds: ['dept-1'],
  roles: ['admin'],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z'
}

export const mockDepartment = {
  id: 'dept-1',
  name: 'Research Department',
  description: 'A test research department',
  userIds: ['test-user-1'],
  createdBy: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userCount: 1
}

// Custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const { session = { user: mockUser }, ...renderOptions } = options

  const Wrapper = ({ children }) => (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock API responses
export const mockApiResponses = {
  projects: {
    success: [mockProject],
    empty: []
  },
  documents: {
    success: [mockDocument],
    empty: []
  },
  users: {
    success: [mockUser],
    empty: []
  },
  departments: {
    success: [mockDepartment],
    empty: []
  }
}

// Helper to mock fetch responses
export const mockFetch = (responses = {}) => {
  global.fetch = jest.fn((url) => {
    const response = responses[url] || { ok: false, status: 404 }
    return Promise.resolve({
      ok: response.ok,
      status: response.status,
      json: () => Promise.resolve(response.data || {}),
      text: () => Promise.resolve(response.text || ''),
    })
  })
}

// Helper to create mock file for upload testing
export const createMockFile = (name = 'test.html', content = '<html><body>Test</body></html>') => {
  const file = new File([content], name, { type: 'text/html' })
  return file
}

// Helper to wait for async operations
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Test to ensure the file is recognized as a test file
describe('Test Utils', () => {
  it('should export mock data', () => {
    expect(mockProject).toBeDefined()
    expect(mockDocument).toBeDefined()
    expect(mockUser).toBeDefined()
    expect(mockDepartment).toBeDefined()
  })

  it('should export utility functions', () => {
    expect(renderWithProviders).toBeDefined()
    expect(mockFetch).toBeDefined()
    expect(createMockFile).toBeDefined()
    expect(waitFor).toBeDefined()
  })
})
