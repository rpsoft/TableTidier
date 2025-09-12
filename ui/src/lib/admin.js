import bcrypt from 'bcryptjs';
import { ADMIN_CONFIG } from '@/config/admin';

/**
 * Check if a user is an admin
 * @param {string} email - User email to check
 * @returns {boolean} - True if user is admin
 */
export function isAdmin(email) {
  return email === ADMIN_CONFIG.email;
}

/**
 * Verify admin credentials
 * @param {string} email - Email to verify
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} - True if credentials are valid
 */
export async function verifyAdminCredentials(email, password) {
  if (email !== ADMIN_CONFIG.email) {
    return false;
  }
  
  // In a real implementation, you'd hash the password and compare
  // For now, we'll do a simple comparison (change this for production!)
  return password === ADMIN_CONFIG.password;
}

/**
 * Hash admin password (for initial setup)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashAdminPassword(password) {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify hashed admin password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyHashedAdminPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
