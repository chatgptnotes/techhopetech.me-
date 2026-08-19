-- Database Triggers for Target Management System
-- Migration: Automated progress updates, notifications, and performance calculations

-- ============================================================================
-- PROGRESS AUTOMATION TRIGGERS
-- ============================================================================

-- Function to calculate and update target progress automatically
CREATE OR REPLACE FUNCTION update_target_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_record RECORD;
  achieved_count INTEGER;
  achievement_pct DECIMAL(5,2);
  remaining_value INTEGER;
  progress_exists BOOLEAN;
BEGIN
  -- Only process for active targets
  IF NEW.status != 'active' AND (TG_OP = 'INSERT' OR NEW.status != 'active') THEN
    RETURN NEW;
  END IF;

  -- Get target details
  SELECT * INTO target_record
  FROM hospital_marketing_targets
  WHERE id = NEW.id;

  -- Calculate achieved value based on target type
  CASE target_record.target_type
    WHEN 'hospital_visits' THEN
      SELECT COUNT(*) INTO achieved_count
      FROM hospital_marketing_visits
      WHERE executive_id = target_record.executive_id
        AND visit_date >= target_record.period_start_date
        AND visit_date <= target_record.period_end_date
        AND status IN ('completed', 'verified');

    WHEN 'doctor_visits' THEN
      SELECT COUNT(*) INTO achieved_count
      FROM hospital_marketing_meetings
      WHERE executive_id = target_record.executive_id
        AND meeting_date >= target_record.period_start_date
        AND meeting_date <= target_record.period_end_date
        AND meeting_type IN ('in_person', 'video_call')
        AND status = 'completed';

    WHEN 'patient_referrals' THEN
      SELECT COUNT(*) INTO achieved_count
      FROM hospital_marketing_referrals
      WHERE executive_id = target_record.executive_id
        AND referral_date >= target_record.period_start_date
        AND referral_date <= target_record.period_end_date
        AND status != 'cancelled';

    WHEN 'referral_meetings' THEN
      SELECT COUNT(*) INTO achieved_count
      FROM hospital_marketing_meetings
      WHERE executive_id = target_record.executive_id
        AND meeting_date >= target_record.period_start_date
        AND meeting_date <= target_record.period_end_date
        AND meeting_type = 'follow_up'
        AND status = 'completed';

    ELSE
      -- For custom targets or corporate visits, set to 0 for now
      achieved_count := 0;
  END CASE;

  -- Calculate achievement percentage
  IF target_record.target_value > 0 THEN
    achievement_pct := (achieved_count::DECIMAL / target_record.target_value) * 100;
  ELSE
    achievement_pct := 0;
  END IF;

  -- Calculate remaining value
  remaining_value := GREATEST(0, target_record.target_value - achieved_count);

  -- Check if progress record exists for today
  SELECT EXISTS(
    SELECT 1 FROM hospital_marketing_target_progress
    WHERE target_id = NEW.id AND progress_date = CURRENT_DATE
  ) INTO progress_exists;

  -- Update or insert progress record
  IF progress_exists THEN
    UPDATE hospital_marketing_target_progress
    SET
      achieved_value = achieved_count,
      pending_value = remaining_value,
      achievement_percentage = achievement_pct,
      source_data = jsonb_build_object(
        'calculated_at', NOW(),
        'target_type', target_record.target_type
      ),
      updated_at = NOW()
    WHERE target_id = NEW.id AND progress_date = CURRENT_DATE;
  ELSE
    INSERT INTO hospital_marketing_target_progress (
      target_id,
      executive_id,
      progress_date,
      achieved_value,
      pending_value,
      achievement_percentage,
      source_data
    ) VALUES (
      NEW.id,
      target_record.executive_id,
      CURRENT_DATE,
      achieved_count,
      remaining_value,
      achievement_pct,
      jsonb_build_object(
        'calculated_at', NOW(),
        'target_type', target_record.target_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply progress update trigger on targets table
CREATE TRIGGER trigger_update_target_progress
AFTER INSERT OR UPDATE ON hospital_marketing_targets
FOR EACH ROW EXECUTE FUNCTION update_target_progress();

-- ============================================================================
-- ACTIVITY-BASED PROGRESS UPDATE TRIGGERS
-- ============================================================================

-- Function to update all related targets when activity is recorded
CREATE OR REPLACE FUNCTION update_targets_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  affected_targets RECORD;
BEGIN
  -- Find all targets that might be affected by this activity
  FOR affected_targets IN
    SELECT id, executive_id, period_start_date, period_end_date, target_type
    FROM hospital_marketing_targets
    WHERE status = 'active'
      AND executive_id = COALESCE(NEW.executive_id, OLD.executive_id)
      AND CURRENT_DATE >= period_start_date
      AND CURRENT_DATE <= period_end_date
  LOOP
    -- Trigger progress update for each affected target
    PERFORM update_target_progress_for_target(affected_targets.id);
  END LOOP;

  -- Return based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to update progress for a specific target
CREATE OR REPLACE FUNCTION update_target_progress_for_target(target_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- This will be called by the trigger above
  -- Reuse the progress calculation logic
  PERFORM update_target_progress();
END;
$$ LANGUAGE plpgsql;

-- Apply activity triggers for visits
CREATE TRIGGER trigger_visit_updates_targets
AFTER INSERT OR UPDATE ON hospital_marketing_visits
FOR EACH ROW EXECUTE FUNCTION update_targets_on_activity();

-- Apply activity triggers for meetings
CREATE TRIGGER trigger_meeting_updates_targets
AFTER INSERT OR UPDATE ON hospital_marketing_meetings
FOR EACH ROW EXECUTE FUNCTION update_targets_on_activity();

-- Apply activity triggers for referrals
CREATE TRIGGER trigger_referral_updates_targets
AFTER INSERT OR UPDATE ON hospital_marketing_referrals
FOR EACH ROW EXECUTE FUNCTION update_targets_on_activity();

-- ============================================================================
-- PERFORMANCE SCORE CALCULATION TRIGGERS
-- ============================================================================

-- Function to calculate comprehensive performance score
CREATE OR REPLACE FUNCTION calculate_performance_score(executive_uuid UUID, period_start DATE, period_end DATE)
RETURNS hospital_marketing_performance_scores AS $$
DECLARE
  result hospital_marketing_performance_scores;
  visit_score DECIMAL(5,2);
  referral_score DECIMAL(5,2);
  task_score DECIMAL(5,2);
  attendance_score DECIMAL(5,2);
  conversion_score DECIMAL(5,2);
  total_score DECIMAL(5,2);
  category VARCHAR(20);
BEGIN
  -- Calculate individual scores

  -- 1. Visit Completion Score (30% weight)
  SELECT COALESCE(
    LEAST(100,
      (COUNT(*) FILTER (WHERE status IN ('completed', 'verified'))::DECIMAL /
       NULLIF(COUNT(*) FILTER (WHERE status IS NOT NULL), 0)) * 100
    ), 0
  ) INTO visit_score
  FROM hospital_marketing_visits
  WHERE executive_id = executive_uuid
    AND visit_date >= period_start
    AND visit_date <= period_end;

  -- 2. Referral Generation Score (25% weight)
  SELECT COALESCE(
    LEAST(100,
      (COUNT(*)::DECIMAL / NULLIF(
        (SELECT SUM(target_value) FROM hospital_marketing_targets
         WHERE executive_id = executive_uuid
         AND target_type = 'patient_referrals'
         AND period_start_date >= period_start
         AND period_end_date <= period_end), 1
      ) * 100)
    ), 0
  ) INTO referral_score
  FROM hospital_marketing_referrals
  WHERE executive_id = executive_uuid
    AND referral_date >= period_start
    AND referral_date <= period_end
    AND status != 'cancelled';

  -- 3. Task Completion Score (20% weight)
  SELECT COALESCE(
    LEAST(100,
      (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
       NULLIF(COUNT(*), 0)) * 100
    ), 0
  ) INTO task_score
  FROM hospital_marketing_tasks
  WHERE executive_id = executive_uuid
    AND task_date >= period_start
    AND task_date <= period_end;

  -- 4. Attendance Score (15% weight) - based on field presence
  SELECT COALESCE(
    LEAST(100,
      (COUNT(DISTINCT visit_date)::DECIMAL /
       NULLIF(EXTRACT(DAYS FROM (period_end - period_start)) + 1, 0)) * 100
    ), 0
  ) INTO attendance_score
  FROM hospital_marketing_visits
  WHERE executive_id = executive_uuid
    AND visit_date >= period_start
    AND visit_date <= period_end
    AND status IN ('completed', 'verified');

  -- 5. Lead Conversion Score (10% weight)
  SELECT COALESCE(
    LEAST(100,
      (COUNT(*) FILTER (WHERE status IN ('confirmed', 'admitted'))::DECIMAL /
       NULLIF(COUNT(*), 0)) * 100
    ), 0
  ) INTO conversion_score
  FROM hospital_marketing_referrals
  WHERE executive_id = executive_uuid
    AND referral_date >= period_start
    AND referral_date <= period_end;

  -- Calculate weighted total score
  total_score :=
    (visit_score * 0.30) +
    (referral_score * 0.25) +
    (task_score * 0.20) +
    (attendance_score * 0.15) +
    (conversion_score * 0.10);

  -- Determine performance category
  IF total_score >= 90 THEN
    category := 'Excellent';
  ELSIF total_score >= 75 THEN
    category := 'Good';
  ELSIF total_score >= 50 THEN
    category := 'Average';
  ELSE
    category := 'Needs Improvement';
  END IF;

  -- Create result record
  SELECT * INTO result
  FROM (
    SELECT
      executive_uuid,
      'monthly'::VARCHAR,
      period_start,
      period_end,
      visit_score,
      referral_score,
      task_score,
      attendance_score,
      conversion_score,
      total_score,
      category,
      NULL::INTEGER, -- rank_position (calculated separately)
      0, -- total_executives (calculated separately)
      jsonb_build_object(
        'visit_metrics', jsonb_build_object('score', visit_score, 'weight', 0.30),
        'referral_metrics', jsonb_build_object('score', referral_score, 'weight', 0.25),
        'task_metrics', jsonb_build_object('score', task_score, 'weight', 0.20),
        'attendance_metrics', jsonb_build_object('score', attendance_score, 'weight', 0.15),
        'conversion_metrics', jsonb_build_object('score', conversion_score, 'weight', 0.10)
      ),
      NOW(), -- created_at
      NOW()  -- updated_at
  ) AS score_data;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update or insert performance scores
CREATE OR REPLACE FUNCTION update_performance_scores()
RETURNS VOID AS $$
DECLARE
  executive_record RECORD;
  period_start DATE;
  period_end DATE;
  score_data hospital_marketing_performance_scores;
  score_exists BOOLEAN;
BEGIN
  -- Calculate current month period
  period_start := DATE_TRUNC('month', CURRENT_DATE);
  period_end := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day';

  -- Process all active executives
  FOR executive_record IN
    SELECT id FROM hospital_marketing_executives WHERE status = 'Active'
  LOOP
    -- Calculate performance score
    SELECT * INTO score_data
    FROM calculate_performance_score(executive_record.id, period_start, period_end);

    -- Check if score record exists
    SELECT EXISTS(
      SELECT 1 FROM hospital_marketing_performance_scores
      WHERE executive_id = executive_record.id
        AND score_period = 'monthly'
        AND period_start_date = period_start
        AND period_end_date = period_end
    ) INTO score_exists;

    -- Update or insert
    IF score_exists THEN
      UPDATE hospital_marketing_performance_scores
      SET
        visit_completion_score = score_data.visit_completion_score,
        referral_generation_score = score_data.referral_generation_score,
        task_completion_score = score_data.task_completion_score,
        attendance_score = score_data.attendance_score,
        lead_conversion_score = score_data.lead_conversion_score,
        total_performance_score = score_data.total_performance_score,
        performance_category = score_data.performance_category,
        metrics_breakdown = score_data.metrics_breakdown,
        updated_at = NOW()
      WHERE executive_id = executive_record.id
        AND score_period = 'monthly'
        AND period_start_date = period_start
        AND period_end_date = period_end;
    ELSE
      INSERT INTO hospital_marketing_performance_scores (
        executive_id,
        score_period,
        period_start_date,
        period_end_date,
        visit_completion_score,
        referral_generation_score,
        task_completion_score,
        attendance_score,
        lead_conversion_score,
        total_performance_score,
        performance_category,
        metrics_breakdown
      ) VALUES (
        score_data.executive_id,
        score_data.score_period,
        score_data.period_start_date,
        score_data.period_end_date,
        score_data.visit_completion_score,
        score_data.referral_generation_score,
        score_data.task_completion_score,
        score_data.attendance_score,
        score_data.lead_conversion_score,
        score_data.total_performance_score,
        score_data.performance_category,
        score_data.metrics_breakdown
      );
    END IF;
  END LOOP;

  -- Update rankings after scores are calculated
  PERFORM update_leaderboard_rankings(period_start, period_end);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LEADERBOARD RANKING TRIGGERS
-- ============================================================================

-- Function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(period_start DATE, period_end DATE)
RETURNS VOID AS $$
DECLARE
  rank_counter INTEGER := 0;
  prev_score DECIMAL(5,2) := -1;
  current_rank INTEGER := 1;
  score_record RECORD;
  leaderboard_entry RECORD;
  entry_exists BOOLEAN;
BEGIN
  -- Clear existing leaderboard for this period
  DELETE FROM hospital_marketing_leaderboard
  WHERE leaderboard_period = 'monthly'
    AND period_start_date = period_start
    AND period_end_date = period_end;

  -- Process scores in descending order
  FOR score_record IN
    SELECT
      executive_id,
      total_performance_score,
      performance_category
    FROM hospital_marketing_performance_scores
    WHERE score_period = 'monthly'
      AND period_start_date = period_start
      AND period_end_date = period_end
    ORDER BY total_performance_score DESC
  LOOP
    rank_counter := rank_counter + 1;

    -- Handle ties: same rank for same scores
    IF score_record.total_performance_score != prev_score THEN
      current_rank := rank_counter;
    END IF;

    -- Get executive name and calculate points
    SELECT name INTO leaderboard_entry.executive_name
    FROM hospital_marketing_executives
    WHERE id = score_record.executive_id;

    -- Calculate points breakdown
    leaderboard_entry.points_total := ROUND(score_record.total_performance_score);
    leaderboard_entry.points_breakdown := jsonb_build_object(
      'base_points', ROUND(score_record.total_performance_score),
      'bonus_points', CASE
        WHEN score_record.performance_category = 'Excellent' THEN 10
        WHEN score_record.performance_category = 'Good' THEN 5
        ELSE 0
      END
    );

    -- Get additional metrics
    SELECT
      COUNT(*) FILTER (WHERE status IN ('completed', 'verified')),
      (SELECT COUNT(*) FROM hospital_marketing_referrals
       WHERE executive_id = score_record.executive_id
       AND referral_date >= period_start
       AND referral_date <= period_end
       AND status != 'cancelled')
    INTO leaderboard_entry.total_visits_completed, leaderboard_entry.referrals_generated
    FROM hospital_marketing_visits
    WHERE executive_id = score_record.executive_id
      AND visit_date >= period_start
      AND visit_date <= period_end;

    -- Calculate target achievement percentage
    SELECT COALESCE(
      LEAST(100,
        (SUM(achieved_value)::DECIMAL / NULLIF(SUM(target_value), 0)) * 100
      ), 0
    ) INTO leaderboard_entry.target_achievement_percentage
    FROM hospital_marketing_target_progress
    WHERE target_id IN (
      SELECT id FROM hospital_marketing_targets
      WHERE executive_id = score_record.executive_id
        AND period_start_date = period_start
        AND period_end_date = period_end
    )
    AND progress_date = CURRENT_DATE;

    -- Insert leaderboard entry
    INSERT INTO hospital_marketing_leaderboard (
      leaderboard_period,
      period_start_date,
      period_end_date,
      executive_id,
      executive_name,
      rank_position,
      target_achievement_percentage,
      total_visits_completed,
      referrals_generated,
      performance_score,
      points_total,
      points_breakdown,
      previous_rank,
      rank_change
    ) VALUES (
      'monthly',
      period_start,
      period_end,
      score_record.executive_id,
      leaderboard_entry.executive_name,
      current_rank,
      leaderboard_entry.target_achievement_percentage,
      leaderboard_entry.total_visits_completed,
      leaderboard_entry.referrals_generated,
      score_record.total_performance_score,
      leaderboard_entry.points_total,
      leaderboard_entry.points_breakdown,
      NULL, -- previous_rank (can be calculated from previous period)
      0     -- rank_change
    );

    prev_score := score_record.total_performance_score;
  END LOOP;

  -- Update total executives count in performance scores
  UPDATE hospital_marketing_performance_scores
  SET total_executives = rank_counter
  WHERE score_period = 'monthly'
    AND period_start_date = period_start
    AND period_end_date = period_end;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED FUNCTIONS FOR DAILY UPDATES
-- ============================================================================

-- Main daily update function (to be called by cron job)
CREATE OR REPLACE FUNCTION daily_target_system_updates()
RETURNS JSONB AS $$
DECLARE
  result JSONB := jsonb_build_object();
  start_time TIMESTAMP := NOW();
  updated_targets INTEGER := 0;
  updated_scores INTEGER := 0;
  generated_notifications INTEGER := 0;
BEGIN
  -- Update all target progress
  FOR updated_targets IN
    SELECT id FROM hospital_marketing_targets WHERE status = 'active'
  LOOP
    PERFORM update_target_progress_for_target(updated_targets);
  END LOOP;

  -- Update performance scores
  PERFORM update_performance_scores();

  -- Get counts
  SELECT COUNT(*) INTO updated_scores
  FROM hospital_marketing_performance_scores
  WHERE updated_at >= start_time;

  -- Build result
  result := jsonb_build_object(
    'success', true,
    'timestamp', NOW(),
    'updated_targets', updated_targets,
    'updated_scores', updated_scores,
    'generated_notifications', generated_notifications,
    'duration_seconds', EXTRACT(EPOCH FROM (NOW() - start_time))
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION update_target_progress() IS 'Automatically calculates and updates target progress based on recorded activities';
COMMENT ON FUNCTION update_targets_on_activity() IS 'Updates all related targets when new activities are recorded';
COMMENT ON FUNCTION calculate_performance_score(UUID, DATE, DATE) IS 'Calculates comprehensive performance score for an executive for a given period';
COMMENT ON FUNCTION update_performance_scores() IS 'Updates or inserts performance scores for all active executives';
COMMENT ON FUNCTION update_leaderboard_rankings(DATE, DATE) IS 'Calculates and stores leaderboard rankings for a given period';
COMMENT ON FUNCTION daily_target_system_updates() IS 'Main daily update function to be called by cron jobs for system maintenance';

-- Grant execute permissions for scheduled jobs
GRANT EXECUTE ON FUNCTION daily_target_system_updates() TO service_role;