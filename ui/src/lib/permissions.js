import { isAdmin } from './admin';

/**
 * Check if the current user has admin privileges
 * @param {Object} session - NextAuth session object
 * @returns {boolean} - True if user is admin
 */
export function hasAdminAccess(session) {
  return session?.user?.role === 'admin' || isAdmin(session?.user?.email);
}

/**
 * Check if user can access a collection (either owner or admin)
 * @param {Object} session - NextAuth session object
 * @param {string} collectionUserId - User ID who owns the collection
 * @returns {boolean} - True if user can access the collection
 */
export function canAccessCollection(session, collectionUserId) {
  if (!session?.user?.email) {
    return false;
  }
  
  // Admin can access any collection
  if (hasAdminAccess(session)) {
    return true;
  }
  
  // Regular users can only access their own collections
  return session.user.email === collectionUserId;
}

/**
 * Check if user can modify data (admin can modify but not take ownership)
 * @param {Object} session - NextAuth session object
 * @param {string} dataUserId - User ID who owns the data
 * @returns {Object} - { canModify: boolean, isAdmin: boolean }
 */
export function canModifyData(session, dataUserId) {
  if (!session?.user?.email) {
    return { canModify: false, isAdmin: false };
  }
  
  const isAdminUser = hasAdminAccess(session);
  const isOwner = session.user.email === dataUserId;
  
  return {
    canModify: isAdminUser || isOwner,
    isAdmin: isAdminUser
  };
}
