-- Row Level Security Policies for Target Management System
-- Migration: Security policies extending existing hospital marketing RLS patterns

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE hospital_marketing_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_marketing_target_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_marketing_performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_marketing_target_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_marketing_leaderboard ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current executive ID from auth UID (reuse existing if available)
CREATE OR REPLACE FUNCTION get_current_target_executive_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin (reuse existing if available)
CREATE OR REPLACE FUNCTION is_target_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access specific executive data
CREATE OR REPLACE FUNCTION can_access_executive_data(executive_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admins can access all data
  IF is_target_admin() THEN
    RETURN TRUE;
  END IF;

  -- Executives can access their own data
  IF executive_uuid = get_current_target_executive_id() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TARGETS TABLE RLS POLICIES
-- ============================================================================

-- Executives can view their own targets
CREATE POLICY "Executives can view own targets"
ON hospital_marketing_targets FOR SELECT
USING (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);

-- Admins can view all targets
CREATE POLICY "Admins can view all targets"
ON hospital_marketing_targets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Admins can insert targets
CREATE POLICY "Admins can insert targets"
ON hospital_marketing_targets FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Admins can update targets
CREATE POLICY "Admins can update targets"
ON hospital_marketing_targets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Admins can delete targets
CREATE POLICY "Admins can delete targets"
ON hospital_marketing_targets FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- PROGRESS TABLE RLS POLICIES
-- ============================================================================

-- Executives can view their own progress
CREATE POLICY "Executives can view own progress"
ON hospital_marketing_target_progress FOR SELECT
USING (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
ON hospital_marketing_target_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- System can insert progress (via triggers/service role)
CREATE POLICY "Service role can insert progress"
ON hospital_marketing_target_progress FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update progress
CREATE POLICY "Admins can update progress"
ON hospital_marketing_target_progress FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- ============================================================================
-- PERFORMANCE SCORES TABLE RLS POLICIES
-- ============================================================================

-- Executives can view their own performance scores
CREATE POLICY "Executives can view own scores"
ON hospital_marketing_performance_scores FOR SELECT
USING (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);

-- Admins can view all performance scores
CREATE POLICY "Admins can view all scores"
ON hospital_marketing_performance_scores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- System can insert/update scores (via automated processes)
CREATE POLICY "Service role can manage scores"
ON hospital_marketing_performance_scores FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Executives can view their own notifications
CREATE POLICY "Executives can view own notifications"
ON hospital_marketing_target_notifications FOR SELECT
USING (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON hospital_marketing_target_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- System can insert notifications (via automated processes)
CREATE POLICY "Service role can insert notifications"
ON hospital_marketing_target_notifications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Executives can update their own notification status (mark as read)
CREATE POLICY "Executives can update own notifications"
ON hospital_marketing_target_notifications FOR UPDATE
USING (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
)
WITH CHECK (
  executive_id IN (
    SELECT id FROM hospital_marketing_executives
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);

-- ============================================================================
-- LEADERBOARD TABLE RLS POLICIES
-- ============================================================================

-- All authenticated users can view leaderboard (for transparency)
CREATE POLICY "All users can view leaderboard"
ON hospital_marketing_leaderboard FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Only system can insert/update leaderboard (via automated processes)
CREATE POLICY "Service role can manage leaderboard"
ON hospital_marketing_leaderboard FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- SECURITY FUNCTIONS FOR AUTOMATED PROCESSES
-- ============================================================================

-- Function to check if service role is making request (for triggers/cron jobs)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the request has the service role key
  -- This is typically checked via the CRON_SECRET or service role key
  RETURN FALSE; -- To be implemented based on auth setup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS FOR AUTOMATED PROCESSES
-- ============================================================================

-- Grant necessary permissions for automated processes
-- These will be used by the calculation triggers and scheduled jobs

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON hospital_marketing_targets TO service_role;
GRANT ALL ON hospital_marketing_target_progress TO service_role;
GRANT ALL ON hospital_marketing_performance_scores TO service_role;
GRANT ALL ON hospital_marketing_target_notifications TO service_role;
GRANT ALL ON hospital_marketing_leaderboard TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_current_target_executive_id() TO service_role;
GRANT EXECUTE ON FUNCTION is_target_admin() TO service_role;
GRANT EXECUTE ON FUNCTION can_access_executive_data(UUID) TO service_role;

-- ============================================================================
-- SECURITY AUDIT FUNCTIONS
-- ============================================================================

-- Function to log target modifications for audit trail
CREATE OR REPLACE FUNCTION log_target_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to audit table (create if doesn't exist)
  INSERT INTO hospital_marketing_activity_log (
    executive_id,
    activity_type,
    activity_data,
    created_at
  ) VALUES (
    COALESCE(NEW.executive_id, OLD.executive_id),
    'target_modified',
    jsonb_build_object(
      'table', 'hospital_marketing_targets',
      'action', TG_OP,
      'old_data', OLD,
      'new_data', NEW,
      'user_id', auth.uid()
    ),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS hospital_marketing_target_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit triggers for targets table
CREATE TRIGGER audit_targets_changes
AFTER INSERT OR UPDATE OR DELETE ON hospital_marketing_targets
FOR EACH ROW EXECUTE FUNCTION log_target_modification();

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE hospital_marketing_target_audit IS 'Audit trail for all target modifications and changes';

COMMENT ON FUNCTION get_current_target_executive_id() IS 'Returns the current executive ID from auth context';
COMMENT ON FUNCTION is_target_admin() IS 'Checks if current user is an admin or manager';
COMMENT ON FUNCTION can_access_executive_data(UUID) IS 'Checks if current user has permission to access specific executive data';
COMMENT ON FUNCTION log_target_modification() IS 'Logs all target modifications to audit table for security tracking';