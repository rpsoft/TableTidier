# TableTidier
Smart Table Data Extraction Tool originally designed to streamline the clinical systematic review process.

# Development checkpoints
- [ ] Interface Redesign
  - [ ] Data flow diagram to inform implementation
  - [ ] Redux implementation
  - [ ] Add User Management UI elements
  - [ ] Add Admin page
    - [ ] User Management
    - [ ] Content Management
    - [ ] Batch functions
  - [ ] User Content management Page
    - [ ] Tables Management
    - [ ] Topical Management and grouping
    - [ ] Classifier Management
      - [ ] Show tables it is depending on, common terms, etc.
  - [ ] Search functionality
    - [ ] Find tables containing terms
    - [ ] Tables for UID
  - [ ] Add Table Uploading page (Single and Batch)
  - [ ] Annotations:
    - [ ] Allow data manipulation after rendering (Potential work around spreading of labels.)
    - [ ] Show original image of the table, (pre-OCR), so users can fix issues easily
  - [ ] Exporting functionality
    - [ ] CSV
    - [ ] XML? (Optional)
    - [ ] Excel? (Optional)
- [ ] Server Code
  - [ ] Modularise code
  - [ ] Reduce redundancy, and simplify code
  - [ ] Reduce external dependencies (DB, Plumber, python)
    - [ ] Change to MongoDB or SQLite
    - [ ] MetaMap, can we get around this?
  - [ ] Database functions and adaptation to Multi-user environment
  - [ ] Implementation of in node "unpivotr" (Optional)
- [ ] Realtime implementation
  - [ ] Utilising Server Side Messaging
- [ ] Self-contained deployment
  - [ ] Packaged as Virtual Machine or Docker container
- [ ] Usage stats module

# Development timeline:

This is a complex software, and we will implement the suggested functionality incrementally, as we use it.

- We will start with re-flowing UI, Redux, User management, and DB (1 month)
- New modules implementation: Tables management, Classifier management, Ontology management (1 month)
- Unpivotr, Metamap, Software Repacking, Usage stats module (2-3 weeks)
-
