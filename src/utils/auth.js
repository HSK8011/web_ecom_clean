/**
 * Check if a user is an admin based on their email
 * @param {Object} user - The user object from Redux state
 * @returns {boolean} - Whether the user is an admin
 */
export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || ['admin@example.com'];
  return adminEmails.includes(user.email.toLowerCase());
}; 