import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadDocumentModal from '@/components/projects/UploadDocumentModal'
import { mockFetch, createMockFile } from '../utils/test-utils'

// Mock fetch globally
global.fetch = jest.fn()

describe('UploadDocumentModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onUpload: jest.fn(),
    projectId: 'test-project-1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch({
      '/api/projects/test-project-1/documents': {
        ok: true,
        data: { id: 'new-doc-1', fileName: 'test.html' }
      }
    })
  })

  it('renders when open', () => {
    render(<UploadDocumentModal {...mockProps} />)
    
    expect(screen.getByRole('heading', { name: 'Upload Document' })).toBeInTheDocument()
    expect(screen.getByText('Select HTML File')).toBeInTheDocument()
    expect(screen.getByText('HTML files only')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<UploadDocumentModal {...mockProps} isOpen={false} />)
    
    expect(screen.queryByRole('heading', { name: 'Upload Document' })).not.toBeInTheDocument()
  })

  it('disables upload button when no file selected', () => {
    render(<UploadDocumentModal {...mockProps} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload document/i })
    expect(uploadButton).toBeDisabled()
  })

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<UploadDocumentModal {...mockProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<UploadDocumentModal {...mockProps} />)
    
    const closeButton = screen.getByRole('button', { name: '' }) // X button has no accessible name
    await user.click(closeButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('renders file input with correct attributes', () => {
    render(<UploadDocumentModal {...mockProps} />)
    
    const fileInput = screen.getByLabelText(/upload a file/i)
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', '.html,.htm')
  })

  it('shows modal title correctly', () => {
    render(<UploadDocumentModal {...mockProps} />)
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Upload Document')
  })

  it('has proper modal structure', () => {
    render(<UploadDocumentModal {...mockProps} />)
    
    // Check for modal backdrop
    expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument()
    
    // Check for modal content
    expect(document.querySelector('.bg-white.rounded-lg')).toBeInTheDocument()
  })
})