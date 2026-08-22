-- ============================================================================
-- WhatsApp Communication portal fixes (applied 2026-08-22 via supabase db query)
-- 1. Registry columns + authenticated policies (originally run as ad-hoc SQL).
-- 2. Authenticated policies for communication history + templates library
--    (fixes 403 "new row violates row-level security policy" for portal users
--    whose metadata lacks marketing roles — e.g. cmd@hopehospital.com).
-- 3. updated_at column on whatsapp_communication_history. The
--    update_communication_history_updated_at trigger references NEW.updated_at,
--    but the column was missing, so every UPDATE failed with
--    42703 "record \"new\" has no field \"updated_at\"".
-- ============================================================================

-- 1. Registry columns (idempotent re-run of the original script)
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS department VARCHAR(255);

DROP POLICY IF EXISTS "Authenticated users can insert" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can insert" ON referral_doctor_whatsapp_registry
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can select" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can select" ON referral_doctor_whatsapp_registry
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2a. Communication history: permissive authenticated policies
DROP POLICY IF EXISTS "Authenticated users can insert" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can insert" ON whatsapp_communication_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can select" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can select" ON whatsapp_communication_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can update" ON whatsapp_communication_history
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2b. Templates library: re-enable RLS (was disabled as a workaround, leaving
-- the table anonymously readable/writable) and allow authenticated CRUD.
ALTER TABLE whatsapp_templates_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select" ON whatsapp_templates_library;
CREATE POLICY "Authenticated users can select" ON whatsapp_templates_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert" ON whatsapp_templates_library;
CREATE POLICY "Authenticated users can insert" ON whatsapp_templates_library
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update" ON whatsapp_templates_library;
CREATE POLICY "Authenticated users can update" ON whatsapp_templates_library
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete" ON whatsapp_templates_library;
CREATE POLICY "Authenticated users can delete" ON whatsapp_templates_library
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 3. Missing column required by update_communication_history_updated_at trigger
ALTER TABLE whatsapp_communication_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Note: cmd@hopehospital.com (user 7a382b68-c400-4223-aac2-305f5446a155) was also
-- given user metadata {"role":"admin","whatsapp_access":true} via SQL so
-- check_whatsapp_communication_access() grants access under the original
-- "Marketing team" policies as well.

-- 4. Fix 23514 check-constraint violation when sending festival templates:
-- whatsapp_templates_library.template_category uses 'festival', but
-- whatsapp_communication_history.message_type only allowed 'festival_greeting'.
ALTER TABLE whatsapp_communication_history
  DROP CONSTRAINT IF EXISTS whatsapp_communication_history_message_type_check;
ALTER TABLE whatsapp_communication_history
  ADD CONSTRAINT whatsapp_communication_history_message_type_check
  CHECK (message_type IN (
    'daily_greeting', 'festival', 'festival_greeting', 'promotion', 'custom',
    'hospital_update', 'health_camp', 'service_launch', 'doctor_appreciation'
  ));
