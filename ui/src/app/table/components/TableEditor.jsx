const editor = useYooptaEditor({
  plugins: [Paragraph, Heading, List, Link, Image, Table, Code, Blockquote, Callout],
  tools: {
    Toolbar: {
      render: () => <YooptaToolbar />,
    },
  },
  selectionBoxRoot: {
    className: 'yoopta-selection-box-root',
  },
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#1f2937',
      text: '#f3f4f6',
      border: '#374151',
      hover: '#4b5563',
      active: '#3b82f6',
      disabled: '#6b7280',
    },
  },
}); 