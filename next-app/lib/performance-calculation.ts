// Performance Calculation Library for HopeTech Hospital Marketing CRM
// Handles performance scoring, rankings, and leaderboard calculations

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PerformanceScore {
  executive_id: string;
  period_start: string;
  period_end: string;

  // Individual scores (0-100)
  visit_completion_score: number;
  referral_generation_score: number;
  task_completion_score: number;
  attendance_score: number;
  lead_conversion_score: number;

  // Overall performance
  total_performance_score: number;
  performance_category: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  rank_position?: number;
  total_executives?: number;

  // Detailed breakdown
  metrics_breakdown: any;
}

export interface LeaderboardEntry {
  rank: number;
  executive_id: string;
  executive_name: string;
  performance_score: number;
  performance_category: string;
  target_achievement_percentage: number;
  total_visits_completed: number;
  referrals_generated: number;
  trend: 'up' | 'down' | 'stable';
  points_total: number;
  points_breakdown: any;
  previous_rank?: number;
  rank_change?: number;
}

export interface PerformanceMetrics {
  executive_id: string;
  period_start: string;
  period_end: string;

  // Visit metrics
  planned_visits: number;
  completed_visits: number;
  verified_visits: number;
  positive_outcome_percentage: number;

  // Referral metrics
  total_referrals: number;
  target_referrals: number;
  confirmed_referrals: number;
  admitted_referrals: number;
  converted_referrals: number;

  // Task metrics
  total_tasks: number;
  completed_tasks: number;
  completed_on_time: number;

  // Attendance metrics
  working_days: number;
  present_days: number;
  field_hours: number;

  // Conversion metrics
  leads_generated: number;
  leads_confirmed: number;
  opportunities_created: number;
  deals_closed: number;
}

// ============================================================================
// PERFORMANCE SCORE CALCULATION
// ============================================================================

/**
 * Calculate comprehensive performance score for an executive
 */
export async function calculatePerformanceScore(
  executiveId: string,
  periodStart: string,
  periodEnd: string
): Promise<PerformanceScore> {
  // Get detailed metrics
  const metrics = await getPerformanceMetrics(executiveId, periodStart, periodEnd);

  // Calculate individual scores
  const visitCompletionScore = calculateVisitCompletionScore(metrics);
  const referralScore = calculateReferralScore(metrics);
  const taskCompletionScore = calculateTaskCompletionScore(metrics);
  const attendanceScore = calculateAttendanceScore(metrics);
  const conversionScore = calculateConversionScore(metrics);

  // Calculate weighted total score
  const totalPerformanceScore =
    (visitCompletionScore * 0.30) +
    (referralScore * 0.25) +
    (taskCompletionScore * 0.20) +
    (attendanceScore * 0.15) +
    (conversionScore * 0.10);

  // Determine performance category
  const performanceCategory = categorizePerformance(totalPerformanceScore);

  // Build metrics breakdown
  const metricsBreakdown = {
    visit_metrics: {
      score: visitCompletionScore,
      weight: 0.30,
      details: {
        planned: metrics.planned_visits,
        completed: metrics.completed_visits,
        verified: metrics.verified_visits,
        completion_rate: metrics.planned_visits > 0 ? (metrics.completed_visits / metrics.planned_visits) * 100 : 0
      }
    },
    referral_metrics: {
      score: referralScore,
      weight: 0.25,
      details: {
        total: metrics.total_referrals,
        target: metrics.target_referrals,
        confirmed: metrics.confirmed_referrals,
        admitted: metrics.admitted_referrals,
        conversion_rate: metrics.total_referrals > 0 ? (metrics.converted_referrals / metrics.total_referrals) * 100 : 0
      }
    },
    task_metrics: {
      score: taskCompletionScore,
      weight: 0.20,
      details: {
        total: metrics.total_tasks,
        completed: metrics.completed_tasks,
        on_time: metrics.completed_on_time,
        completion_rate: metrics.total_tasks > 0 ? (metrics.completed_tasks / metrics.total_tasks) * 100 : 0
      }
    },
    attendance_metrics: {
      score: attendanceScore,
      weight: 0.15,
      details: {
        working_days: metrics.working_days,
        present_days: metrics.present_days,
        field_hours: metrics.field_hours,
        attendance_rate: metrics.working_days > 0 ? (metrics.present_days / metrics.working_days) * 100 : 0
      }
    },
    conversion_metrics: {
      score: conversionScore,
      weight: 0.10,
      details: {
        leads: metrics.leads_generated,
        confirmed: metrics.leads_confirmed,
        opportunities: metrics.opportunities_created,
        closed: metrics.deals_closed,
        conversion_rate: metrics.leads_generated > 0 ? (metrics.deals_closed / metrics.leads_generated) * 100 : 0
      }
    }
  };

  return {
    executive_id: executiveId,
    period_start: periodStart,
    period_end: periodEnd,
    visit_completion_score: visitCompletionScore,
    referral_generation_score: referralScore,
    task_completion_score: taskCompletionScore,
    attendance_score: attendanceScore,
    lead_conversion_score: conversionScore,
    total_performance_score: totalPerformanceScore,
    performance_category: performanceCategory,
    metrics_breakdown: metricsBreakdown
  };
}

/**
 * Calculate performance scores for all executives in a period
 */
export async function calculateAllExecutiveScores(
  periodStart: string,
  periodEnd: string
): Promise<PerformanceScore[]> {
  // Get all active executives
  const { data: executives, error: execError } = await supabase
    .from('hospital_marketing_executives')
    .select('id')
    .eq('status', 'Active');

  if (execError || !executives) {
    throw new Error('Failed to fetch executives');
  }

  // Calculate scores for all executives in parallel
  const scorePromises = executives.map(executive =>
    calculatePerformanceScore(executive.id, periodStart, periodEnd)
  );

  const scores = await Promise.all(scorePromises);

  // Calculate rankings
  const sortedScores = scores.sort((a, b) => b.total_performance_score - a.total_performance_score);
  let currentRank = 1;

  sortedScores.forEach((score, index) => {
    // Handle ties: same rank for same scores
    if (index > 0 && score.total_performance_score === sortedScores[index - 1].total_performance_score) {
      score.rank_position = currentRank;
    } else {
      currentRank = index + 1;
      score.rank_position = currentRank;
    }
    score.total_executives = sortedScores.length;
  });

  return sortedScores;
}

// ============================================================================
// LEADERBOARD CALCULATION
// ============================================================================

/**
 * Generate leaderboard for a specific period
 */
export async function generateLeaderboard(
  periodType: 'daily' | 'weekly' | 'monthly' = 'monthly',
  periodStart?: string,
  periodEnd?: string
): Promise<LeaderboardEntry[]> {
  // Default to current month if no period specified
  if (!periodStart || !periodEnd) {
    const currentDate = new Date();
    periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
  }

  // Calculate all performance scores
  const scores = await calculateAllExecutiveScores(periodStart, periodEnd);

  // Get executive details for leaderboard
  const leaderboardPromises = scores.map(async (score) => {
    // Get executive name
    const { data: executive } = await supabase
      .from('hospital_marketing_executives')
      .select('name')
      .eq('id', score.executive_id)
      .single();

    // Calculate points breakdown
    const pointsBreakdown = {
      visit_points: Math.round(score.visit_completion_score * 0.30),
      referral_points: Math.round(score.referral_generation_score * 0.25),
      task_points: Math.round(score.task_completion_score * 0.20),
      bonus_points: score.performance_category === 'Excellent' ? 10 :
                   score.performance_category === 'Good' ? 5 : 0
    };

    const pointsTotal = Object.values(pointsBreakdown).reduce((sum, val) => sum + val, 0);

    // Get additional metrics
    const { data: visits } = await supabase
      .from('hospital_marketing_visits')
      .select('id')
      .eq('executive_id', score.executive_id)
      .gte('visit_date', periodStart)
      .lte('visit_date', periodEnd)
      .in('status', ['completed', 'verified']);

    const { data: referrals } = await supabase
      .from('hospital_marketing_referrals')
      .select('id')
      .eq('executive_id', score.executive_id)
      .gte('referral_date', periodStart)
      .lte('referral_date', periodEnd)
      .neq('status', 'cancelled');

    // Calculate target achievement percentage
    const { data: targetProgress } = await supabase
      .from('hospital_marketing_target_progress')
      .select('achievement_percentage')
      .eq('executive_id', score.executive_id)
      .eq('progress_date', new Date().toISOString().split('T')[0]);

    const avgAchievement = targetProgress && targetProgress.length > 0
      ? targetProgress.reduce((sum, p) => sum + p.achievement_percentage, 0) / targetProgress.length
      : 0;

    // Calculate trend (compare with previous period)
    const trend = await calculateTrend(score.executive_id, periodStart, periodEnd);

    return {
      rank: score.rank_position || 0,
      executive_id: score.executive_id,
      executive_name: executive?.name || 'Unknown',
      performance_score: score.total_performance_score,
      performance_category: score.performance_category,
      target_achievement_percentage: avgAchievement,
      total_visits_completed: visits?.length || 0,
      referrals_generated: referrals?.length || 0,
      trend: trend,
      points_total: pointsTotal,
      points_breakdown: pointsBreakdown,
      previous_rank: undefined, // Can be calculated from previous period
      rank_change: 0
    };
  });

  const leaderboard = await Promise.all(leaderboardPromises);

  // Sort by rank
  leaderboard.sort((a, b) => a.rank - b.rank);

  return leaderboard;
}

/**
 * Get leaderboard summary statistics
 */
export async function getLeaderboardSummary(
  periodStart: string,
  periodEnd: string
): Promise<{
  total_executives: number;
  top_performer: LeaderboardEntry;
  average_score: number;
  excellent_count: number;
  good_count: number;
  average_count: number;
  needs_improvement_count: number;
}> {
  const leaderboard = await generateLeaderboard('monthly', periodStart, periodEnd);

  if (leaderboard.length === 0) {
    throw new Error('No executives found for the specified period');
  }

  const averageScore = leaderboard.reduce((sum, entry) => sum + entry.performance_score, 0) / leaderboard.length;

  const categoryCounts = {
    excellent_count: leaderboard.filter(e => e.performance_category === 'Excellent').length,
    good_count: leaderboard.filter(e => e.performance_category === 'Good').length,
    average_count: leaderboard.filter(e => e.performance_category === 'Average').length,
    needs_improvement_count: leaderboard.filter(e => e.performance_category === 'Needs Improvement').length
  };

  return {
    total_executives: leaderboard.length,
    top_performer: leaderboard[0],
    average_score: averageScore,
    ...categoryCounts
  };
}

// ============================================================================
// HELPER CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate visit completion score
 */
function calculateVisitCompletionScore(metrics: PerformanceMetrics): number {
  if (metrics.planned_visits === 0) return 0;

  const completionRate = (metrics.completed_visits / metrics.planned_visits) * 100 * 0.70;
  const verificationRate = metrics.completed_visits > 0
    ? (metrics.verified_visits / metrics.completed_visits) * 100 * 0.20
    : 0;
  const qualityScore = metrics.positive_outcome_percentage * 0.10;

  return Math.min(100, completionRate + verificationRate + qualityScore);
}

/**
 * Calculate referral generation score
 */
function calculateReferralScore(metrics: PerformanceMetrics): number {
  if (metrics.total_referrals === 0) return 0;

  const targetValue = metrics.target_referrals > 0 ? metrics.target_referrals : 1;
  const generationScore = Math.min(100, (metrics.total_referrals / targetValue) * 100) * 0.40;
  const confirmationScore = (metrics.confirmed_referrals / metrics.total_referrals) * 100 * 0.25;
  const conversionScore = (metrics.converted_referrals / metrics.total_referrals) * 100 * 0.25;
  const qualityScore = (metrics.admitted_referrals / metrics.total_referrals) * 100 * 0.10;

  return generationScore + confirmationScore + conversionScore + qualityScore;
}

/**
 * Calculate task completion score
 */
function calculateTaskCompletionScore(metrics: PerformanceMetrics): number {
  if (metrics.total_tasks === 0) return 100; // No tasks = perfect score

  const completionRate = (metrics.completed_tasks / metrics.total_tasks) * 100 * 0.70;
  const timelinessScore = metrics.completed_tasks > 0
    ? (metrics.completed_on_time / metrics.completed_tasks) * 100 * 0.30
    : 0;

  return completionRate + timelinessScore;
}

/**
 * Calculate attendance score
 */
function calculateAttendanceScore(metrics: PerformanceMetrics): number {
  if (metrics.working_days === 0) return 0;

  const attendanceRate = (metrics.present_days / metrics.working_days) * 100 * 0.70;
  const expectedHours = metrics.working_days * 8; // 8 hours per day
  const productivityScore = Math.min(100, (metrics.field_hours / expectedHours) * 100) * 0.30;

  return attendanceRate + productivityScore;
}

/**
 * Calculate conversion score
 */
function calculateConversionScore(metrics: PerformanceMetrics): number {
  if (metrics.leads_generated === 0) return 0;

  const leadQualityScore = (metrics.leads_confirmed / metrics.leads_generated) * 100 * 0.40;
  const opportunityScore = metrics.leads_confirmed > 0
    ? (metrics.opportunities_created / metrics.leads_confirmed) * 100 * 0.30
    : 0;
  const closureScore = metrics.opportunities_created > 0
    ? (metrics.deals_closed / metrics.opportunities_created) * 100 * 0.30
    : 0;

  return leadQualityScore + opportunityScore + closureScore;
}

/**
 * Categorize performance score
 */
function categorizePerformance(score: number): 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

/**
 * Get detailed performance metrics for an executive
 */
async function getPerformanceMetrics(
  executiveId: string,
  periodStart: string,
  periodEnd: string
): Promise<PerformanceMetrics> {
  // Get visit metrics
  const { data: visits } = await supabase
    .from('hospital_marketing_visits')
    .select('status, visit_date')
    .eq('executive_id', executiveId)
    .gte('visit_date', periodStart)
    .lte('visit_date', periodEnd);

  const plannedVisits = visits?.length || 0;
  const completedVisits = visits?.filter(v => v.status === 'completed').length || 0;
  const verifiedVisits = visits?.filter(v => v.status === 'verified').length || 0;

  // Get referral metrics
  const { data: referrals } = await supabase
    .from('hospital_marketing_referrals')
    .select('status')
    .eq('executive_id', executiveId)
    .gte('referral_date', periodStart)
    .lte('referral_date', periodEnd)
    .neq('status', 'cancelled');

  const totalReferrals = referrals?.length || 0;
  const confirmedReferrals = referrals?.filter(r => r.status === 'confirmed').length || 0;
  const admittedReferrals = referrals?.filter(r => r.status === 'admitted').length || 0;
  const convertedReferrals = referrals?.filter(r => r.status === 'discharged').length || 0;

  // Get target referrals
  const { data: targetReferrals } = await supabase
    .from('hospital_marketing_targets')
    .select('target_value')
    .eq('executive_id', executiveId)
    .eq('target_type', 'patient_referrals')
    .eq('period_start_date', periodStart)
    .eq('period_end_date', periodEnd)
    .maybeSingle();

  const targetReferralValue = targetReferrals?.target_value || totalReferrals;

  // Get task metrics
  const { data: tasks } = await supabase
    .from('hospital_marketing_tasks')
    .select('status, due_date, completed_date')
    .eq('executive_id', executiveId)
    .gte('task_date', periodStart)
    .lte('task_date', periodEnd);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const completedOnTime = tasks?.filter(t => {
    if (t.status !== 'completed' || !t.due_date || !t.completed_date) return false;
    return new Date(t.completed_date) <= new Date(t.due_date);
  }).length || 0;

  // Calculate working days and attendance
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const workingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Count days with visits as present days
  const presentDays = new Set(visits?.map(v => v.visit_date)).size || 0;

  // Estimate field hours (8 hours per day present)
  const fieldHours = presentDays * 8;

  return {
    executive_id: executiveId,
    period_start: periodStart,
    period_end: periodEnd,

    // Visit metrics
    planned_visits: plannedVisits,
    completed_visits: completedVisits,
    verified_visits: verifiedVisits,
    positive_outcome_percentage: 75, // Placeholder - would need meeting outcome data

    // Referral metrics
    total_referrals: totalReferrals,
    target_referrals: targetReferralValue,
    confirmed_referrals: confirmedReferrals,
    admitted_referrals: admittedReferrals,
    converted_referrals: convertedReferrals,

    // Task metrics
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    completed_on_time: completedOnTime,

    // Attendance metrics
    working_days: workingDays,
    present_days: presentDays,
    field_hours: fieldHours,

    // Conversion metrics (simplified)
    leads_generated: totalReferrals,
    leads_confirmed: confirmedReferrals,
    opportunities_created: confirmedReferrals, // Simplified
    deals_closed: admittedReferrals // Simplified
  };
}

/**
 * Calculate performance trend
 */
async function calculateTrend(
  executiveId: string,
  currentPeriodStart: string,
  currentPeriodEnd: string
): Promise<'up' | 'down' | 'stable'> {
  // Get current score
  const currentScore = await calculatePerformanceScore(executiveId, currentPeriodStart, currentPeriodEnd);

  // Calculate previous period (previous month)
  const currentDate = new Date(currentPeriodStart);
  const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  try {
    const previousScore = await calculatePerformanceScore(
      executiveId,
      previousMonthStart.toISOString().split('T')[0],
      previousMonthEnd.toISOString().split('T')[0]
    );

    const scoreDifference = currentScore.total_performance_score - previousScore.total_performance_score;

    if (scoreDifference > 5) return 'up';
    if (scoreDifference < -5) return 'down';
    return 'stable';
  } catch {
    return 'stable'; // If no previous data, consider stable
  }
}