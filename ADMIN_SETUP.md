# Admin User Setup

This document describes how to set up and use the admin user functionality in TableTidier.

## Overview

The admin user is a special diagnostic account that has access to all collections and tables in the system, regardless of who owns them. The admin user is designed for system diagnostics and troubleshooting while preserving data ownership.

## Key Features

- **Full Access**: Admin can view and modify all collections and tables
- **Preserved Ownership**: Admin operations never change the original owner of data
- **Diagnostic Purpose**: Intended for system administration and troubleshooting
- **Secure Authentication**: Uses credentials-based authentication separate from OAuth

## Setup

### 1. Environment Variables

Create a `.env.local` file in the `ui/` directory with the following variables:

```env
# Admin Configuration
ADMIN_EMAIL=admin@tabletidier.local
ADMIN_PASSWORD=your_secure_admin_password_here

# Other existing variables...
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MONGODB_URI=mongodb://localhost:27017/tabletidier
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Install Dependencies

```bash
cd ui
npm install
```

### 3. Start the Application

```bash
npm run dev
```

## Usage

### Admin Login

1. Navigate to `/auth/admin` in your browser
2. Enter the admin email and password from your environment variables
3. Click "Sign in"

### Admin Capabilities

- **View All Collections**: Admin can see all collections in the system
- **View All Tables**: Admin can access tables from any collection
- **Modify Data**: Admin can update table content and annotations
- **Preserve Ownership**: All modifications maintain the original data owner

### Security Considerations

1. **Change Default Password**: The default password is `admin123` - change this immediately in production
2. **Environment Variables**: Store admin credentials in environment variables, not in code
3. **Access Control**: Admin access is logged and should be monitored
4. **Data Integrity**: Admin operations are designed to preserve data ownership

## API Changes

The following API endpoints now support admin access:

- `GET /api/collections` - Returns all collections for admin, user's collections for regular users
- `GET /api/collections/[id]` - Admin can access any collection
- `GET /api/collections/[id]/tables` - Admin can access tables from any collection
- `GET /api/collections/[id]/tables/[tableId]` - Admin can access any table
- `PUT /api/table` - Admin can update any table while preserving ownership

## UI Changes

- **Admin Indicator**: A yellow banner appears when logged in as admin
- **Admin Login Page**: Dedicated login page at `/auth/admin`
- **Preserved UI**: Regular users see no changes to the interface

## Technical Implementation

### Authentication
- Uses NextAuth.js with credentials provider
- Admin role is stored in the session
- Separate from Google OAuth authentication

### Permissions
- `hasAdminAccess()` - Checks if user is admin
- `canAccessCollection()` - Checks collection access (admin or owner)
- `canModifyData()` - Checks modification permissions

### Data Protection
- Ownership fields (`userId`, `collectionId`, `id`) are protected from modification
- Admin operations are logged for audit purposes
- Original data ownership is never changed

## Troubleshooting

### Admin Login Issues
1. Check environment variables are set correctly
2. Verify the admin email matches exactly
3. Check browser console for authentication errors

### Permission Issues
1. Ensure admin role is properly set in session
2. Check that permission functions are imported correctly
3. Verify API routes are using the permission helpers

### Data Access Issues
1. Check MongoDB connection
2. Verify collection and table IDs are correct
3. Check that ownership is being preserved correctly

## Security Best Practices

1. **Strong Passwords**: Use a strong, unique password for admin account
2. **Regular Rotation**: Change admin password regularly
3. **Access Logging**: Monitor admin access and operations
4. **Environment Security**: Secure your environment variables
5. **Network Security**: Consider IP restrictions for admin access in production
