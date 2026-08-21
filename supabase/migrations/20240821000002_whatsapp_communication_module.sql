-- WhatsApp Communication Module for HopeTech CRM
-- Migration: Enhanced Doctor Communication System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENHANCED DOCTOR REGISTRY
-- ============================================================================

-- Add columns to existing doctor registry (if table exists)
-- If the table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS referral_doctor_whatsapp_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctor_visits(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
  specialty VARCHAR(255),
  hospital_name VARCHAR(255),
  city VARCHAR(255),
  remarks TEXT,
  whatsapp_enabled BOOLEAN DEFAULT true,
  communication_preferences JSONB DEFAULT '{"daily_greetings": true, "festivals": true, "promotions": true, "custom": true}',
  last_communication_date TIMESTAMP,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_delivered INTEGER DEFAULT 0,
  total_messages_read INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  added_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WHATSAPP COMMUNICATION HISTORY
-- ============================================================================

CREATE TABLE whatsapp_communication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES referral_doctor_whatsapp_registry(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN
    ('daily_greeting', 'festival_greeting', 'promotion', 'custom', 'hospital_update', 'health_camp', 'service_launch', 'doctor_appreciation')),
  recipient_count INTEGER DEFAULT 1,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN
    ('pending', 'sent', 'delivered', 'read', 'failed')),
  doubletick_message_id VARCHAR(255),
  delivery_metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WHATSAPP TEMPLATES LIBRARY
-- ============================================================================

CREATE TABLE whatsapp_templates_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_category VARCHAR(50) NOT NULL CHECK (template_category IN
    ('daily_greeting', 'festival', 'promotion', 'hospital_update', 'health_camp', 'service_launch', 'doctor_appreciation', 'custom')),
  message_content TEXT NOT NULL,
  media_type VARCHAR(20) DEFAULT 'text' CHECK (media_type IN
    ('text', 'image', 'video', 'document', 'audio')),
  media_url TEXT,
  placeholder_variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PREDEFINED TEMPLATES FOR HOSPITAL USE
-- ============================================================================

-- Insert predefined templates
INSERT INTO whatsapp_templates_library (template_name, template_category, message_content, placeholder_variables) VALUES
  ('Daily Good Morning', 'daily_greeting',
   '🌅 Good Morning Dr. {doctor_name}! Wishing you a wonderful day ahead. Thank you for your continued trust in Hope Hospital.',
   '["doctor_name"]'),

  ('Diwali Greeting', 'festival',
   '🪔 Happy Diwali Dr. {doctor_name}! May this festival bring joy and prosperity to you and your family. Wishing you a prosperous year ahead!',
   '["doctor_name"]'),

  ('Doctors Day Wishes', 'doctor_appreciation',
   'Happy Doctors Day Dr. {doctor_name}! Your dedication to healthcare inspires us at Hope Hospital. Thank you for your exceptional service to the community.',
   '["doctor_name"]'),

  ('Health Camp Invitation', 'health_camp',
   'Dear Dr. {doctor_name}, Hope Hospital is organizing a free health camp on {date} at {location}. We would value your participation in serving the community.',
   '["doctor_name", "date", "location"]'),

  ('New Service Launch', 'service_launch',
   'Dear Dr. {doctor_name}, Hope Hospital is excited to launch our new {specialty} service. We would love to give you a demonstration and discuss how we can collaborate.',
   '["doctor_name", "specialty"]'),

  ('Hospital Update', 'hospital_update',
   'Dear Dr. {doctor_name}, Hope Hospital has achieved a significant milestone: {update}. We wanted to share this news with our valued partner doctors.',
   '["doctor_name", "update"]'),

  ('General Promotion', 'promotion',
   'Dear Dr. {doctor_name}, Hope Hospital now offers {service} with special benefits for referral partners. We look forward to continued collaboration.',
   '["doctor_name", "service"]');

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for enhanced doctor registry
CREATE INDEX IF NOT EXISTS idx_whatsapp_registry_doctor ON referral_doctor_whatsapp_registry(doctor_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_registry_enabled ON referral_doctor_whatsapp_registry(whatsapp_enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_registry_specialty ON referral_doctor_whatsapp_registry(specialty);
CREATE INDEX IF NOT EXISTS idx_whatsapp_registry_city ON referral_doctor_whatsapp_registry(city);
CREATE INDEX IF NOT EXISTS idx_whatsapp_registry_hospital ON referral_doctor_whatsapp_registry(hospital_name);

-- Indexes for communication history
CREATE INDEX IF NOT EXISTS idx_comm_history_doctor ON whatsapp_communication_history(doctor_id);
CREATE INDEX IF NOT EXISTS idx_comm_history_date ON whatsapp_communication_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_comm_history_status ON whatsapp_communication_history(delivery_status);
CREATE INDEX IF NOT EXISTS idx_comm_history_template ON whatsapp_communication_history(template_id);
CREATE INDEX IF NOT EXISTS idx_comm_history_sent_by ON whatsapp_communication_history(sent_by);

-- Indexes for templates library
CREATE INDEX IF NOT EXISTS idx_templates_category ON whatsapp_templates_library(template_category);
CREATE NOT EXISTS idx_templates_active ON whatsapp_templates_library(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_name ON whatsapp_templates_library(template_name);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Updated at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_doctor_registry_updated_at ON referral_doctor_whatsapp_registry;
CREATE TRIGGER update_doctor_registry_updated_at BEFORE UPDATE ON referral_doctor_whatsapp_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_history_updated_at ON whatsapp_communication_history;
CREATE TRIGGER update_communication_history_updated_at BEFORE UPDATE ON whatsapp_communication_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_library_updated_at ON whatsapp_templates_library;
CREATE TRIGGER update_templates_library_updated_at BEFORE UPDATE ON whatsapp_templates_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE referral_doctor_whatsapp_registry IS 'Enhanced registry of referral doctors with WhatsApp numbers for Hope Hospital communication';
COMMENT ON TABLE whatsapp_communication_history IS 'Complete communication log for all WhatsApp messages sent to doctors';
COMMENT ON TABLE whatsapp_templates_library IS 'Library of WhatsApp message templates for various communication purposes';

COMMENT ON COLUMN referral_doctor_whatsapp_registry.communication_preferences IS 'JSONB object storing communication preferences: {"daily_greetings": true, "festivals": true, "promotions": true, "custom": true}';
COMMENT ON COLUMN whatsapp_templates_library.placeholder_variables IS 'Array of variable names that can be used in message templates, e.g., ["doctor_name", "hospital_name", "specialty"]';