-- Sample Data for Target Management System Testing
-- Run this in your Supabase SQL Editor after migrations

-- 1. Create a test marketing executive (if not exists)
INSERT INTO hospital_marketing_executives (id, user_id, name, employee_code, territory, phone, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'test-user-1', 'Test Executive', 'ME001', 'Nagpur Central', '+91 98765 43210', 'Active')
ON CONFLICT (id) DO UPDATE SET status = 'Active';

-- 2. Create sample targets for current month
INSERT INTO hospital_marketing_targets (executive_id, target_type, target_name, target_value, target_period, period_start_date, period_end_date, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'hospital_visits', 'Monthly Hospital Visits', 50, 'monthly', '2026-08-01', '2026-08-31', 'active'),
  ('550e8400-e29b-41d4-a716-446655440001', 'doctor_visits', 'Doctor Meetings', 30, 'monthly', '2026-08-01', '2026-08-31', 'active'),
  ('550e8400-e29b-41d4-a716-446655440001', 'patient_referrals', 'Patient Referrals', 20, 'monthly', '2026-08-01', '2026-08-31', 'active'),
  ('550e8400-e29b-41d4-a716-446655440001', 'referral_meetings', 'Referral Follow-ups', 15, 'monthly', '2026-08-01', '2026-08-31', 'active')
ON CONFLICT (executive_id, target_type, period_start_date, period_end_date)
DO UPDATE SET target_value = EXCLUDED.target_value;

-- 3. Simulate some progress (halfway through month)
INSERT INTO hospital_marketing_target_progress (target_id, executive_id, progress_date, achieved_value, pending_value, achievement_percentage)
SELECT
  t.id,
  t.executive_id,
  CURRENT_DATE,
  CASE t.target_type
    WHEN 'hospital_visits' THEN 25
    WHEN 'doctor_visits' THEN 18
    WHEN 'patient_referrals' THEN 12
    WHEN 'referral_meetings' THEN 8
    ELSE 0
  END,
  CASE t.target_type
    WHEN 'hospital_visits' THEN 25
    WHEN 'doctor_visits' THEN 12
    WHEN 'patient_referrals' THEN 8
    WHEN 'referral_meetings' THEN 7
    ELSE 0
  END,
  CASE t.target_type
    WHEN 'hospital_visits' THEN 50.0
    WHEN 'doctor_visits' THEN 60.0
    WHEN 'patient_referrals' THEN 60.0
    WHEN 'referral_meetings' THEN 53.3
    ELSE 0
  END
FROM hospital_marketing_targets t
WHERE t.executive_id = '550e8400-e29b-41d4-a716-446655440001'
  AND t.status = 'active'
ON CONFLICT (target_id, progress_date)
DO UPDATE SET
  achieved_value = EXCLUDED.achieved_value,
  pending_value = EXCLUDED.pending_value,
  achievement_percentage = EXCLUDED.achievement_percentage;

-- 4. Create a test notification
INSERT INTO hospital_marketing_target_notifications (executive_id, notification_type, notification_title, notification_message, priority_level, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'mid_month_alert', 'Mid-Month Check: Hospital Visits', 'You have achieved 50% of your hospital visits target with 15 days remaining. Keep up the good work!', 'medium', 'sent');

-- 5. Create sample performance score
INSERT INTO hospital_marketing_performance_scores (
  executive_id, score_period, period_start_date, period_end_date,
  visit_completion_score, referral_generation_score, task_completion_score,
  attendance_score, lead_conversion_score, total_performance_score, performance_category
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 'monthly', '2026-08-01', '2026-08-31',
  75.0, 70.0, 80.0, 85.0, 65.0, 74.0, 'Average'
)
ON CONFLICT (executive_id, score_period, period_start_date, period_end_date)
DO UPDATE SET
  total_performance_score = EXCLUDED.total_performance_score,
  performance_category = EXCLUDED.performance_category;

-- 6. Create leaderboard entry
INSERT INTO hospital_marketing_leaderboard (
  leaderboard_period, period_start_date, period_end_date, executive_id, executive_name,
  rank_position, target_achievement_percentage, total_visits_completed, referrals_generated, performance_score
)
VALUES (
  'monthly', '2026-08-01', '2026-08-31', '550e8400-e29b-41d4-a716-446655440001', 'Test Executive',
  1, 55.8, 25, 12, 74.0
)
ON CONFLICT (executive_id, leaderboard_period, period_start_date, period_end_date)
DO UPDATE SET
  rank_position = EXCLUDED.rank_position,
  performance_score = EXCLUDED.performance_score;

SELECT 'Sample data created successfully!' as status;