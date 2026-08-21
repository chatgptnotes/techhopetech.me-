-- WhatsApp Communication Module Authentication
-- Create separate user roles and permissions for Marketing team access

-- Create custom role for WhatsApp Communication users
CREATE ROLE IF NOT EXISTS whatsapp_communication_user;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO whatsapp_communication_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON referral_doctor_whatsapp_registry TO whatsapp_communication_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_communication_history TO whatsapp_communication_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_templates_library TO whatsapp_communication_user;
GRANT SELECT ON doctor_visits TO whatsapp_communication_user;

-- Create authentication helper function
CREATE OR REPLACE FUNCTION check_whatsapp_communication_access(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has whatsapp_communication role or is admin
    EXISTS(
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND (
            raw_user_meta_data->>'role' = 'marketing_head'
            OR raw_user_meta_data->>'role' = 'marketing_team'
            OR raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create row level security policies
ALTER TABLE referral_doctor_whatsapp_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing team can view all doctors"
    ON referral_doctor_whatsapp_registry FOR SELECT
    USING (check_whatsapp_communication_control(auth.uid()));

CREATE POLICY "Marketing team can add doctors"
    ON referral_doctor_whatsapp_registry FOR INSERT
    WITH CHECK (check_whatsapp_communication_access(auth.uid()));

CREATE POLICY "Marketing team can update doctors"
    ON referral_doctor_whatsapp_registry FOR UPDATE
    USING (check_whatsapp_communication_access(auth.uid()));

CREATE POLICY "Marketing team can delete doctors"
    ON referral_doctor_whatsapp_registry FOR DELETE
    USING (check_whatsapp_communication_access(auth.uid()));

ALTER TABLE whatsapp_templates_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketing team can view templates"
    ON whatsapp_templates_library FOR SELECT
    USING (check_whatsapp_communication_access(auth.uid()));

CREATE POLICY "Marketing team can add templates"
    ON whatsapp_templates_library FOR INSERT
    WITH CHECK (check_whatsapp_communication_access(auth.uid()));

CREATE POLICY "Marketing team can update templates"
    ON whatsapp_templates_library FOR UPDATE
    USING (check_whatsapp_communication_access(auth.uid()));

CREATE POLICY "Marketing team can delete templates"
    ON whatsapp_templates_library FOR DELETE
    USING (check_whatsapp_communication_access(auth.uid()));