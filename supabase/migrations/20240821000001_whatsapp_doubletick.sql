-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Referral Doctor WhatsApp Registry
CREATE TABLE referral_doctor_whatsapp_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctor_visits(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
  specialty VARCHAR(255),
  hospital_name VARCHAR(255),
  city VARCHAR(255),
  whatsapp_enabled BOOLEAN DEFAULT true,
  communication_preferences JSONB DEFAULT '{"daily_greetings": true, "festivals": true, "promotions": true}',
  last_communication_date TIMESTAMP,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_delivered INTEGER DEFAULT 0,
  total_messages_read INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Message Queue
CREATE TABLE whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('daily_greeting', 'festival', 'promotion', 'custom')),
  doctor_id UUID REFERENCES referral_doctor_whatsapp_registry(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_variables JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP NOT NULL,
  send_attempts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  doubletick_message_id VARCHAR(255),
  doubletick_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Management
CREATE TABLE whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name VARCHAR(100) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  schedule_config JSONB DEFAULT '{}',
  recipient_filters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Festival Calendar
CREATE TABLE whatsapp_festival_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  festival_name VARCHAR(100) NOT NULL,
  festival_date DATE NOT NULL,
  festival_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100),
  auto_send BOOLEAN DEFAULT true,
  send_days_before INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_whatsapp_registry_doctor ON referral_doctor_whatsapp_registry(doctor_id);
CREATE INDEX idx_whatsapp_registry_enabled ON referral_doctor_whatsapp_registry(whatsapp_enabled);
CREATE INDEX idx_message_queue_scheduled ON whatsapp_message_queue(scheduled_for, status);
CREATE INDEX idx_message_queue_doctor ON whatsapp_message_queue(doctor_id);
CREATE INDEX idx_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX idx_campaigns_type ON whatsapp_campaigns(campaign_type);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_whatsapp_registry_updated_at BEFORE UPDATE ON referral_doctor_whatsapp_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE referral_doctor_whatsapp_registry IS 'Registry of referral doctors with WhatsApp numbers for Hope Hospital communication';
COMMENT ON TABLE whatsapp_message_queue IS 'Queue for WhatsApp messages to be sent via Doubletick API';
COMMENT ON TABLE whatsapp_campaigns IS 'WhatsApp campaigns for different communication purposes';
COMMENT ON TABLE whatsapp_festival_calendar IS 'Calendar of festivals and occasions for automated greetings';