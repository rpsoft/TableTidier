# TableTidier
Smart Table Data Extraction Tool originally designed to streamline the clinical systematic review process.

# Development checkpoints
- [X] Interface Redesign
  - [ ] Data flow diagram to inform implementation
  - [X] Redux implementation
  - [X] Add User Management UI elements
  - [ ] Add Admin page
    - [ ] User Management
    - [ ] Content Management
    - [ ] Batch functions
  - [X] User Content management Page
    - [X] Tables Management
    - [ ] Topical Management and grouping
    - [ ] Classifier Management
      - [ ] Show tables it is depending on, common terms, etc.
  - [X] Search functionality
    - [X] Find tables containing terms
    - [ ] Tables for UID
  - [X] Add Table Uploading page (Single and Batch)
  - [X] Annotations:
    - [X] Allow data manipulation after rendering (Potential work around spreading of labels.)
    - [ ] Show original image of the table, (pre-OCR), so users can fix issues easily
  - [ ] Exporting functionality
    - [ ] CSV
    - [ ] XML? (Optional)
    - [ ] Excel? (Optional)
- [ ] Server Code
  - [X] Modularise code
  - [X] Reduce redundancy, and simplify code
  - [ ] Reduce external dependencies (DB, Plumber, python)
    - [ ] Change to MongoDB or SQLite
    - [ ] MetaMap, can we get around this?
  - [X] Database functions and adaptation to Multi-user environment
  - [ ] Implementation of in node "unpivotr" (Optional)
- [ ] Realtime implementation
  - [ ] Utilising Server Side Messaging
- [ ] Self-contained deployment
  - [ ] Packaged as Virtual Machine or Docker container
- [ ] Usage stats module

# Development timeline:

This is a complex software, and we will implement the suggested functionality incrementally, as we use it.

- We will start with re-flowing UI, Redux, User management, and DB (1 month)
- New modules implementation: Tables management, Classifier management, Ontology management, Search (1.5 months)
- Unpivotr, Metamap, Software Repacking, Usage stats module (2 weeks)
-
