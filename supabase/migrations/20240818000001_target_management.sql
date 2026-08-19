-- Target Management System for HopeTech Hospital Marketing CRM
-- Migration: Core Schema for Target Assignment and Performance Tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TARGET MANAGEMENT TABLES
-- ============================================================================

-- Core Targets Table: Store monthly targets assigned to marketing executives
CREATE TABLE hospital_marketing_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES hospital_marketing_executives(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN
    ('hospital_visits', 'doctor_visits', 'corporate_visits', 'referral_meetings', 'patient_referrals', 'custom')),
  target_name VARCHAR(100) NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 0,
  target_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (target_period IN ('daily', 'weekly', 'monthly', 'quarterly')),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assignment_notes TEXT,
  priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_executive_target_period UNIQUE(executive_id, target_type, period_start_date, period_end_date),
  CONSTRAINT valid_period_dates CHECK (period_end_date >= period_start_date)
);

-- Real-time Progress Tracking: Track target achievement progress
CREATE TABLE hospital_marketing_target_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_id UUID NOT NULL REFERENCES hospital_marketing_targets(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES hospital_marketing_executives(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
  achieved_value INTEGER DEFAULT 0,
  pending_value INTEGER DEFAULT 0,
  achievement_percentage DECIMAL(5,2) DEFAULT 0,
  source_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_target_progress_date UNIQUE(target_id, progress_date)
);

-- Performance Scores: Store calculated performance scores and rankings
CREATE TABLE hospital_marketing_performance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES hospital_marketing_executives(id) ON DELETE CASCADE,
  score_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Performance Metrics (0-100 scale)
  visit_completion_score DECIMAL(5,2) DEFAULT 0,
  referral_generation_score DECIMAL(5,2) DEFAULT 0,
  task_completion_score DECIMAL(5,2) DEFAULT 0,
  attendance_score DECIMAL(5,2) DEFAULT 0,
  lead_conversion_score DECIMAL(5,2) DEFAULT 0,

  -- Overall Performance
  total_performance_score DECIMAL(5,2) DEFAULT 0,
  performance_category VARCHAR(20) DEFAULT 'Needs Improvement'
    CHECK (performance_category IN ('Excellent', 'Good', 'Average', 'Needs Improvement')),
  rank_position INTEGER,
  total_executives INTEGER,

  -- Detailed Breakdown
  metrics_breakdown JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_executive_score_period UNIQUE(executive_id, score_period, period_start_date, period_end_date),
  CONSTRAINT valid_period_dates CHECK (period_end_date >= period_start_date)
);

-- Smart Notifications: Store notification rules and generated alerts
CREATE TABLE hospital_marketing_target_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES hospital_marketing_executives(id) ON DELETE CASCADE,
  target_id UUID REFERENCES hospital_marketing_targets(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN
    ('target_behind_schedule', 'mid_month_alert', 'deadline_approaching', 'monthly_completion', 'underperformer_alert')),
  notification_title VARCHAR(200) NOT NULL,
  notification_message TEXT NOT NULL,
  priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
  notification_channel VARCHAR(20) DEFAULT 'in_app' CHECK (notification_channel IN ('in_app', 'email', 'sms', 'whatsapp')),

  -- Trigger Conditions
  trigger_percentage DECIMAL(5,2),
  trigger_date DATE,
  trigger_days_remaining INTEGER,

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  delivery_attempts INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard: Monthly ranking snapshots
CREATE TABLE hospital_marketing_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  executive_id UUID NOT NULL REFERENCES hospital_marketing_executives(id) ON DELETE CASCADE,
  executive_name VARCHAR(100) NOT NULL,
  rank_position INTEGER NOT NULL,
  target_achievement_percentage DECIMAL(5,2) DEFAULT 0,
  total_visits_completed INTEGER DEFAULT 0,
  referrals_generated INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2) DEFAULT 0,

  -- Ranking Details
  points_total INTEGER DEFAULT 0,
  points_breakdown JSONB DEFAULT '{}',
  previous_rank INTEGER,
  rank_change INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_executive_leaderboard_period UNIQUE(executive_id, leaderboard_period, period_start_date, period_end_date),
  CONSTRAINT valid_period_dates CHECK (period_end_date >= period_start_date)
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for targets table
CREATE INDEX idx_targets_executive_period ON hospital_marketing_targets(executive_id, period_start_date, period_end_date);
CREATE INDEX idx_targets_status ON hospital_marketing_targets(status);
CREATE INDEX idx_targets_type ON hospital_marketing_targets(target_type);
CREATE INDEX idx_targets_period_dates ON hospital_marketing_targets(period_start_date, period_end_date);

-- Indexes for progress table
CREATE INDEX idx_progress_target_date ON hospital_marketing_target_progress(target_id, progress_date);
CREATE INDEX idx_progress_executive_period ON hospital_marketing_target_progress(executive_id, progress_date);
CREATE INDEX idx_progress_achievement ON hospital_marketing_target_progress(achievement_percentage);

-- Indexes for performance scores
CREATE INDEX idx_scores_executive_period ON hospital_marketing_performance_scores(executive_id, score_period, period_start_date);
CREATE INDEX idx_scores_category ON hospital_marketing_performance_scores(performance_category);
CREATE INDEX idx_scores_ranking ON hospital_marketing_performance_scores(rank_position);
CREATE INDEX idx_scores_total_score ON hospital_marketing_performance_scores(total_performance_score);

-- Indexes for notifications
CREATE INDEX idx_notifications_executive_status ON hospital_marketing_target_notifications(executive_id, status);
CREATE INDEX idx_notifications_scheduled ON hospital_marketing_target_notifications(scheduled_for, status);
CREATE INDEX idx_notifications_type ON hospital_marketing_target_notifications(notification_type);
CREATE INDEX idx_notifications_priority ON hospital_marketing_target_notifications(priority_level);

-- Indexes for leaderboard
CREATE INDEX idx_leaderboard_period ON hospital_marketing_leaderboard(leaderboard_period, period_start_date, period_end_date);
CREATE INDEX idx_leaderboard_ranking ON hospital_marketing_leaderboard(rank_position);
CREATE INDEX idx_leaderboard_score ON hospital_marketing_leaderboard(performance_score);

-- ============================================================================
-- AUTOMATIC UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON hospital_marketing_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON hospital_marketing_target_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON hospital_marketing_performance_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON hospital_marketing_target_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE hospital_marketing_targets IS 'Stores monthly targets assigned to marketing executives for performance tracking';
COMMENT ON TABLE hospital_marketing_target_progress IS 'Real-time tracking of target achievement with daily progress updates';
COMMENT ON TABLE hospital_marketing_performance_scores IS 'Calculated performance scores and rankings for executives';
COMMENT ON TABLE hospital_marketing_target_notifications IS 'Smart notification system for target alerts and management notifications';
COMMENT ON TABLE hospital_marketing_leaderboard IS 'Monthly ranking snapshots showing executive performance rankings';

COMMENT ON COLUMN hospital_marketing_targets.target_type IS 'Type of target: hospital_visits, doctor_visits, corporate_visits, referral_meetings, patient_referrals, custom';
COMMENT ON COLUMN hospital_marketing_targets.target_value IS 'Numeric target value to be achieved';
COMMENT ON COLUMN hospital_marketing_performance_scores.total_performance_score IS 'Overall performance score (0-100) calculated from weighted individual scores';
COMMENT ON COLUMN hospital_marketing_performance_scores.performance_category IS 'Performance rating: Excellent (90-100%), Good (75-89%), Average (50-74%), Needs Improvement (<50%)';