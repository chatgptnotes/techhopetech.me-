-- Fix: whatsapp_templates_library.template_category uses 'festival', but
-- whatsapp_communication_history.message_type only allowed 'festival_greeting'.
-- Sending any festival template (e.g. Diwali Greeting) failed with
-- 23514 check constraint violation. Align the history constraint with the
-- template vocabulary (keeping 'festival_greeting' for backward compatibility).
ALTER TABLE whatsapp_communication_history
  DROP CONSTRAINT IF EXISTS whatsapp_communication_history_message_type_check;
ALTER TABLE whatsapp_communication_history
  ADD CONSTRAINT whatsapp_communication_history_message_type_check
  CHECK (message_type IN (
    'daily_greeting', 'festival', 'festival_greeting', 'promotion', 'custom',
    'hospital_update', 'health_camp', 'service_launch', 'doctor_appreciation'
  ));
