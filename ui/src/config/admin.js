// Admin configuration
// In production, these should be set via environment variables

export const ADMIN_CONFIG = {
  // Admin email - set via ADMIN_EMAIL environment variable
  email: process.env.ADMIN_EMAIL || 'admin@tabletidier.local',
  
  // Admin password - set via ADMIN_PASSWORD environment variable
  // IMPORTANT: Change this in production!
  password: process.env.ADMIN_PASSWORD || 'admin123',
  
  // Admin display name
  name: 'Admin',
  
  // Admin role identifier
  role: 'admin'
};

// Helper function to check if an email is the admin email
export function isAdminEmail(email) {
  return email === ADMIN_CONFIG.email;
}

// Helper function to get admin configuration
export function getAdminConfig() {
  return {
    email: ADMIN_CONFIG.email,
    name: ADMIN_CONFIG.name,
    role: ADMIN_CONFIG.role
  };
}
