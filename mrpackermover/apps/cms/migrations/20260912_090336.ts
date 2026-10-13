import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "author" SET DEFAULT 'The MrMoverPacker Team';
  ALTER TABLE "_posts_v" ALTER COLUMN "version_author" SET DEFAULT 'The MrMoverPacker Team';
  ALTER TABLE "proposals" ALTER COLUMN "company_name" SET DEFAULT 'MrMoverPacker';
  ALTER TABLE "proposals" ALTER COLUMN "company_email" SET DEFAULT 'shiftwith@mrmoverpacker.com';
  ALTER TABLE "proposals" ALTER COLUMN "company_web" SET DEFAULT 'mrmoverpacker.com';
  ALTER TABLE "org_profile" ALTER COLUMN "brand_name" SET DEFAULT 'MrMoverPacker';
  ALTER TABLE "leads" ADD COLUMN "quoted_low" numeric;
  ALTER TABLE "leads" ADD COLUMN "quoted_high" numeric;
  ALTER TABLE "leads" ADD COLUMN "distance_km" numeric;
  ALTER TABLE "leads" ADD COLUMN "quote_basis" varchar;
  ALTER TABLE "_leads_v" ADD COLUMN "version_quoted_low" numeric;
  ALTER TABLE "_leads_v" ADD COLUMN "version_quoted_high" numeric;
  ALTER TABLE "_leads_v" ADD COLUMN "version_distance_km" numeric;
  ALTER TABLE "_leads_v" ADD COLUMN "version_quote_basis" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "author" SET DEFAULT 'The MrPackerMover Team';
  ALTER TABLE "_posts_v" ALTER COLUMN "version_author" SET DEFAULT 'The MrPackerMover Team';
  ALTER TABLE "proposals" ALTER COLUMN "company_name" SET DEFAULT 'MrPackerMover';
  ALTER TABLE "proposals" ALTER COLUMN "company_email" SET DEFAULT 'shiftwith@mrpackermover.com';
  ALTER TABLE "proposals" ALTER COLUMN "company_web" SET DEFAULT 'mrpackermover.com';
  ALTER TABLE "org_profile" ALTER COLUMN "brand_name" SET DEFAULT 'MrPackerMover';
  ALTER TABLE "leads" DROP COLUMN "quoted_low";
  ALTER TABLE "leads" DROP COLUMN "quoted_high";
  ALTER TABLE "leads" DROP COLUMN "distance_km";
  ALTER TABLE "leads" DROP COLUMN "quote_basis";
  ALTER TABLE "_leads_v" DROP COLUMN "version_quoted_low";
  ALTER TABLE "_leads_v" DROP COLUMN "version_quoted_high";
  ALTER TABLE "_leads_v" DROP COLUMN "version_distance_km";
  ALTER TABLE "_leads_v" DROP COLUMN "version_quote_basis";`)
}
