import type { Access, FieldAccess, PayloadRequest, Where } from 'payload';

/**
 * CMS roles.
 *
 *   admin   — everything, no restrictions.
 *   editor  — site content (pre-existing, unchanged).
 *   ops     — site content (pre-existing, unchanged).
 *   handler — the sales desk: sees every lead and distributes them to salespeople.
 *   sales   — works only the leads assigned to them.
 *
 * `editor` and `ops` are deliberately left exactly as they were: they are content
 * roles, they predate the sales hierarchy, and live accounts use them.
 */
export type Role = 'admin' | 'editor' | 'ops' | 'handler' | 'sales';

/** Roles that maintain site content. The sales hierarchy is NOT in this list. */
export const CONTENT_ROLES: readonly Role[] = ['admin', 'editor', 'ops'];
/** Roles that work the lead pipeline. */
export const SALES_ROLES: readonly Role[] = ['admin', 'handler', 'sales'];

type MaybeUser = { id?: string | number; role?: string } | null | undefined;

const roleOf = (req: PayloadRequest): Role | undefined => (req.user as MaybeUser)?.role as Role;
const userId = (req: PayloadRequest): string | number | undefined => (req.user as MaybeUser)?.id;

export const isRole = (req: PayloadRequest, ...roles: Role[]): boolean => {
  const r = roleOf(req);
  return r !== undefined && roles.includes(r);
};

/** Any authenticated CMS user (staff). */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

/** Admins only — used for internal-only data such as operating_bases. */
export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin';
export const isAdminField: FieldAccess = ({ req }) => roleOf(req) === 'admin';

/**
 * Content staff: admin, editor, ops. Handlers and salespeople are excluded, so the
 * sales hierarchy cannot create, edit or delete anything on the public site.
 */
export const isContentStaff: Access = ({ req }) => CONTENT_ROLES.includes(roleOf(req) as Role);

/**
 * Public read is limited to published rows. Content staff see everything (drafts
 * included). The public site never reaches Payload directly at runtime — it reads the
 * static manifest — but this keeps the Local/REST API honest if it is ever exposed.
 *
 * Handlers and salespeople are refused outright, drafts and published alike: they work
 * the lead pipeline and nothing else.
 */
export const publishedOrStaff: Access = ({ req }) => {
  if (CONTENT_ROLES.includes(roleOf(req) as Role)) return true;
  // Signed in but not content staff — a handler or a salesperson. They get nothing:
  // the sales hierarchy has no business reading site content, and hiding these from
  // the sidebar alone would still leave them readable over the REST API.
  if (req.user) return false;
  // Anonymous keeps the published-only contract the public API has always had.
  return { _status: { equals: 'published' } };
};

/**
 * Public read for collections that have NO drafts (media, faqs, jobs-stats, people,
 * content-blocks). `publishedOrStaff` cannot be used on those: for an anonymous
 * request it returns a `_status` constraint, and Payload throws "Cannot find field
 * for path at _status" on a collection without versioning — a 500, not a 403. That
 * broke local media serving, where `/api/media/file/<name>` is fetched anonymously
 * by the browser (with Cloudinary configured the CDN serves the file instead, which
 * is why production never surfaced it).
 *
 * These stay readable by everyone on purpose: the public site loads these files and
 * strings. Write access is still content-staff only.
 */
export const publicRead: Access = () => true;

/**
 * Same public contract as `publicRead`, but a signed-in handler or salesperson is
 * refused. Used for the draft-less content collections (faqs, content-blocks, people,
 * jobs-stats): the public site still reads them anonymously, while the sales hierarchy
 * gets nothing, matching how `publishedOrStaff` treats the collections that do have
 * drafts. Media deliberately keeps plain `publicRead` — those are binary assets the
 * browser fetches directly, and blocking them would break image serving.
 */
export const publicReadExceptSalesRoles: Access = ({ req }) => {
  if (req.user && !CONTENT_ROLES.includes(roleOf(req) as Role)) return false;
  return true;
};

/* ── Sales pipeline ──────────────────────────────────────────────────────────── */

/**
 * Leads. Admins and handlers see the whole board, because distributing work requires
 * seeing all of it. A salesperson sees only what is assigned to them, expressed as a
 * query constraint rather than a boolean so Payload filters the list, the count and
 * every REST response identically.
 */
export const leadsRead: Access = ({ req }) => {
  if (!req.user) return false;
  if (isRole(req, 'admin', 'handler')) return true;
  if (isRole(req, 'sales')) return { assignedTo: { equals: userId(req) } };
  return false;
};

/** Same shape for writes: a salesperson can only work their own leads. */
export const leadsUpdate: Access = leadsRead;

/** Only admins and handlers remove leads. A salesperson never deletes one. */
export const leadsDelete: Access = ({ req }) => isRole(req, 'admin', 'handler');

/**
 * Proposals follow their lead: a salesperson sees the ones raised against leads
 * assigned to them. Payload resolves `lead.assignedTo` as a relationship join.
 *
 * Authorship is the second half, and it is not optional. Scoping on the lead alone
 * meant a proposal saved before a lead was picked matched nothing, so the moment a
 * salesperson pressed Save the admin told them their own new document "could not be
 * found". `createdBy` keeps a draft visible to its author until a lead is attached.
 */
export const proposalsRead: Access = ({ req }) => {
  if (!req.user) return false;
  if (isRole(req, 'admin', 'handler')) return true;
  if (isRole(req, 'sales')) {
    const me = userId(req);
    return { or: [{ 'lead.assignedTo': { equals: me } }, { createdBy: { equals: me } }] } as Where;
  }
  return false;
};

export const proposalsWrite: Access = ({ req }) => isRole(req, 'admin', 'handler', 'sales');

/** Inbox collections holding personal data nobody in the sales hierarchy needs. */
export const isContentStaffOnly: Access = ({ req }) => CONTENT_ROLES.includes(roleOf(req) as Role);

/* ── Admin UI visibility ─────────────────────────────────────────────────────── */

/**
 * Hides a collection from the sidebar for anyone outside the content roles.
 *
 * This is tidiness, NOT security: `admin.hidden` does not stop the REST API. Every
 * collection that uses this must also carry a matching `access` rule, which is why
 * the two always appear together below.
 */
export const hideFromSalesRoles = ({ user }: { user?: MaybeUser }): boolean =>
  !CONTENT_ROLES.includes(user?.role as Role);

/** Hides a collection from anyone who is not an admin. */
export const adminOnlyNav = ({ user }: { user?: MaybeUser }): boolean => user?.role !== 'admin';
