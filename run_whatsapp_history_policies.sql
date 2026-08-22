-- Authenticated-user policies for the WhatsApp Communication portal tables.
-- Permissive policies: OR'd with the existing "Marketing team" policies, so
-- any signed-in portal user can work with the tables.

-- whatsapp_communication_history: needed by MessageComposer (INSERT)
-- and DeliveryStatus (SELECT), plus delivery-status updates (UPDATE).
DROP POLICY IF EXISTS "Authenticated users can insert" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can insert" ON whatsapp_communication_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can select" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can select" ON whatsapp_communication_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update" ON whatsapp_communication_history;
CREATE POLICY "Authenticated users can update" ON whatsapp_communication_history
  FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- whatsapp_templates_library: RLS was disabled as a workaround, leaving the
-- table readable/writable by anonymous requests. Re-enable it and allow the
-- (now authenticated) portal to do full CRUD.
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
