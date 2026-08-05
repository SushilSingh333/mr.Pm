import type { Access, FieldAccess } from 'payload';

/** Any authenticated CMS user (staff). */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

/** Admins only — used for internal-only data such as operating_bases. */
export const isAdmin: Access = ({ req }) => req.user?.role === 'admin';
export const isAdminField: FieldAccess = ({ req }) => req.user?.role === 'admin';

/**
 * Public read is limited to published rows. Staff see everything (drafts included).
 * The public site never reaches Payload directly at runtime — it reads the static
 * manifest — but this keeps the Local/REST API honest if it is ever exposed.
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true;
  return { _status: { equals: 'published' } };
};
