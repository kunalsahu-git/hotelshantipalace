/**
 * Admin whitelist configuration
 * Add authorized admin email addresses here
 * In production, consider moving this to Firestore for dynamic management
 */
export const ADMIN_EMAILS = [
  'admin@shantipalace.com',
  'manager@shantipalace.com',
  // Add more admin emails as needed
];

/**
 * Check if an email is authorized to access the admin panel
 */
export function isAuthorizedAdmin(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
  );
}
