import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_leads_note_log_kind" AS ENUM('note', 'call-answered', 'call-no-answer', 'call-later', 'quote-sent', 'competitor', 'price', 'stage', 'handover');
  CREATE TYPE "public"."enum__leads_v_version_note_log_kind" AS ENUM('note', 'call-answered', 'call-no-answer', 'call-later', 'quote-sent', 'competitor', 'price', 'stage', 'handover');
  ALTER TYPE "public"."enum_leads_status" ADD VALUE 'scheduled' BEFORE 'won';
  ALTER TYPE "public"."enum__leads_v_version_status" ADD VALUE 'scheduled' BEFORE 'won';
  CREATE TABLE "sales_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_url" varchar DEFAULT 'mrmoverpacker.com' NOT NULL,
  	"first_contact" varchar DEFAULT 'Hello *{name},*
  
  Thank you for contacting us about your *{service}*.
  Your move: *{from}* to *{to}*
  Let me know when you are free and I will take you through the details and the price.
  
  I''m *{agent}* from *{brand}*.
  
  *{site}*' NOT NULL,
  	"quote_follow_up" varchar DEFAULT 'Hello *{name},*
  
  Following up on the quote we sent you for your *{service}*.
  Your move: *{from}* to *{to}*
  Happy to go through anything in it, or to look at the date again if that helps.
  
  I''m *{agent}* from *{brand}*.
  
  *{site}*' NOT NULL,
  	"booked" varchar DEFAULT 'Hello *{name},*
  
  Your *{service}* is confirmed with us.
  Your move: *{from}* to *{to}*
  Our team will reach you on the day. Anything you need before then, just reply here.
  
  I''m *{agent}* from *{brand}*.
  
  *{site}*' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "schedule_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"moves_per_day" numeric DEFAULT 4 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "leads_note_log" ADD COLUMN "kind" "enum_leads_note_log_kind" DEFAULT 'note';
  ALTER TABLE "leads_note_log" ADD COLUMN "amount" numeric;
  ALTER TABLE "leads" ADD COLUMN "due_at" timestamp(3) with time zone;
  ALTER TABLE "leads" ADD COLUMN "waiting_since" timestamp(3) with time zone;
  ALTER TABLE "_leads_v_version_note_log" ADD COLUMN "kind" "enum__leads_v_version_note_log_kind" DEFAULT 'note';
  ALTER TABLE "_leads_v_version_note_log" ADD COLUMN "amount" numeric;
  ALTER TABLE "_leads_v" ADD COLUMN "version_due_at" timestamp(3) with time zone;
  ALTER TABLE "_leads_v" ADD COLUMN "version_waiting_since" timestamp(3) with time zone;
  CREATE INDEX "leads_due_at_idx" ON "leads" USING btree ("due_at");
  CREATE INDEX "leads_waiting_since_idx" ON "leads" USING btree ("waiting_since");
  CREATE INDEX "_leads_v_version_version_due_at_idx" ON "_leads_v" USING btree ("version_due_at");
  CREATE INDEX "_leads_v_version_version_waiting_since_idx" ON "_leads_v" USING btree ("version_waiting_since");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sales_messages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "schedule_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sales_messages" CASCADE;
  DROP TABLE "schedule_settings" CASCADE;
  ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_leads_status";
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'assigned', 'reassigned', 'contacted', 'call-not-picked', 'call-later', 'follow-up', 'quoted', 'won', 'lost', 'invalid');
  ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_leads_status";
  ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "public"."enum_leads_status" USING "status"::"public"."enum_leads_status";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DATA TYPE text;
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum__leads_v_version_status";
  CREATE TYPE "public"."enum__leads_v_version_status" AS ENUM('new', 'assigned', 'reassigned', 'contacted', 'call-not-picked', 'call-later', 'follow-up', 'quoted', 'won', 'lost', 'invalid');
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DEFAULT 'new'::"public"."enum__leads_v_version_status";
  ALTER TABLE "_leads_v" ALTER COLUMN "version_status" SET DATA TYPE "public"."enum__leads_v_version_status" USING "version_status"::"public"."enum__leads_v_version_status";
  DROP INDEX "leads_due_at_idx";
  DROP INDEX "leads_waiting_since_idx";
  DROP INDEX "_leads_v_version_version_due_at_idx";
  DROP INDEX "_leads_v_version_version_waiting_since_idx";
  ALTER TABLE "leads_note_log" DROP COLUMN "kind";
  ALTER TABLE "leads_note_log" DROP COLUMN "amount";
  ALTER TABLE "leads" DROP COLUMN "due_at";
  ALTER TABLE "leads" DROP COLUMN "waiting_since";
  ALTER TABLE "_leads_v_version_note_log" DROP COLUMN "kind";
  ALTER TABLE "_leads_v_version_note_log" DROP COLUMN "amount";
  ALTER TABLE "_leads_v" DROP COLUMN "version_due_at";
  ALTER TABLE "_leads_v" DROP COLUMN "version_waiting_since";
  DROP TYPE "public"."enum_leads_note_log_kind";
  DROP TYPE "public"."enum__leads_v_version_note_log_kind";`)
}
