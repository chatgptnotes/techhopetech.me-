// Target Management Library for HopeTech Hospital Marketing CRM
// Handles target CRUD operations, progress tracking, and validation

import { db } from '@/lib/supabase-admin';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Target {
  id: string;
  executive_id: string;
  target_type: 'hospital_visits' | 'doctor_visits' | 'corporate_visits' | 'referral_meetings' | 'patient_referrals' | 'custom';
  target_name: string;
  target_value: number;
  target_period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  period_start_date: string;
  period_end_date: string;
  assigned_by?: string;
  assignment_notes?: string;
  priority_level: 'high' | 'medium' | 'low';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TargetWithProgress extends Target {
  achieved_value: number;
  achievement_percentage: number;
  remaining_value: number;
  days_remaining: number;
  is_on_track: boolean;
  progress_history: TargetProgress[];
}

export interface TargetProgress {
  id: string;
  target_id: string;
  executive_id: string;
  progress_date: string;
  achieved_value: number;
  pending_value: number;
  achievement_percentage: number;
  source_data: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTargetRequest {
  executive_id: string;
  target_type: Target['target_type'];
  target_name: string;
  target_value: number;
  target_period: Target['target_period'];
  period_start_date: string;
  period_end_date: string;
  assigned_by: string;
  assignment_notes?: string;
  priority_level?: Target['priority_level'];
}

export interface UpdateTargetRequest {
  target_value?: number;
  status?: Target['status'];
  assignment_notes?: string;
  priority_level?: Target['priority_level'];
  period_end_date?: string;
}

// ============================================================================
// TARGET CRUD OPERATIONS
// ============================================================================

/**
 * Create a new target for a marketing executive
 */
export async function createTarget(request: CreateTargetRequest): Promise<TargetWithProgress> {
  // Remove authentication logic - this should be handled by the calling route
  // This function now just performs the database operations

  // Validate dates
  const startDate = new Date(request.period_start_date);
  const endDate = new Date(request.period_end_date);

  if (endDate < startDate) {
    throw new Error('Period end date must be after start date');
  }

  // Validate target value
  if (request.target_value <= 0) {
    throw new Error('Target value must be greater than 0');
  }

  // Check if executive exists
  const { data: executive, error: execError } = await db
    .from('hospital_marketing_executives')
    .select('id, name, status')
    .eq('id', request.executive_id)
    .single();

  if (execError || !executive) {
    throw new Error('Executive not found');
  }

  if (executive.status !== 'Active') {
    throw new Error('Cannot assign targets to inactive executives');
  }

  // Create target
  const { data: target, error: targetError } = await db
    .from('hospital_marketing_targets')
    .insert({
      executive_id: request.executive_id,
      target_type: request.target_type,
      target_name: request.target_name,
      target_value: request.target_value,
      target_period: request.target_period,
      period_start_date: request.period_start_date,
      period_end_date: request.period_end_date,
      assigned_by: request.assigned_by,
      assignment_notes: request.assignment_notes,
      priority_level: request.priority_level || 'medium',
      status: 'active'
    })
    .select()
    .single();

  if (targetError) {
    throw new Error(`Failed to create target: ${targetError.message}`);
  }

  // Get initial progress
  const progress = await getTargetProgress(target.id);

  return {
    ...target,
    achieved_value: progress.achieved_value,
    achievement_percentage: progress.achievement_percentage,
    remaining_value: progress.remaining_value,
    days_remaining: calculateDaysRemaining(target.period_end_date),
    is_on_track: calculateOnTrackStatus(progress.achievement_percentage, target.period_start_date, target.period_end_date),
    progress_history: []
  };
}

/**
 * Get targets with optional filtering
 */
export async function getTargets(filters: {
  executive_id?: string;
  target_type?: string;
  status?: string;
  period_start?: string;
  period_end?: string;
  include_progress?: boolean;
} = {}): Promise<TargetWithProgress[]> {
  let query = db
    .from('hospital_marketing_targets')
    .select(`
      *,
      hospital_marketing_executives (
        id,
        name,
        employee_code
      )
    `);

  // Apply filters
  if (filters.executive_id) {
    query = query.eq('executive_id', filters.executive_id);
  }

  if (filters.target_type) {
    query = query.eq('target_type', filters.target_type);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.period_start) {
    query = query.gte('period_start_date', filters.period_start);
  }

  if (filters.period_end) {
    query = query.lte('period_end_date', filters.period_end);
  }

  // Only show active targets for current period by default
  if (!filters.period_start && !filters.period_end) {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    query = query
      .gte('period_start_date', startOfMonth.toISOString().split('T')[0])
      .lte('period_end_date', endOfMonth.toISOString().split('T')[0]);
  }

  query = query.order('created_at', { ascending: false });

  const { data: targets, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch targets: ${error.message}`);
  }

  // Enhance with progress data if requested
  if (filters.include_progress) {
    const targetsWithProgress = await Promise.all(
      targets.map(async (target: any) => {
        const progress = await getTargetProgress(target.id);
        const progressHistory = await getTargetProgressHistory(target.id);

        return {
          ...target,
          achieved_value: progress.achieved_value,
          achievement_percentage: progress.achievement_percentage,
          remaining_value: progress.remaining_value,
          days_remaining: calculateDaysRemaining(target.period_end_date),
          is_on_track: calculateOnTrackStatus(
            progress.achievement_percentage,
            target.period_start_date,
            target.period_end_date
          ),
          progress_history: progressHistory
        };
      })
    );

    return targetsWithProgress;
  }

  return targets as TargetWithProgress[];
}

/**
 * Get a single target by ID
 */
export async function getTarget(targetId: string): Promise<TargetWithProgress> {
  const { data: target, error } = await db
    .from('hospital_marketing_targets')
    .select(`
      *,
      hospital_marketing_executives (
        id,
        name,
        employee_code
      )
    `)
    .eq('id', targetId)
    .single();

  if (error || !target) {
    throw new Error('Target not found');
  }

  const progress = await getTargetProgress(targetId);
  const progressHistory = await getTargetProgressHistory(targetId);

  return {
    ...target,
    achieved_value: progress.achieved_value,
    achievement_percentage: progress.achievement_percentage,
    remaining_value: progress.remaining_value,
    days_remaining: calculateDaysRemaining(target.period_end_date),
    is_on_track: calculateOnTrackStatus(
      progress.achievement_percentage,
      target.period_start_date,
      target.period_end_date
    ),
    progress_history: progressHistory
  };
}

/**
 * Update an existing target
 */
export async function updateTarget(targetId: string, updates: UpdateTargetRequest): Promise<TargetWithProgress> {
  // Validate target exists
  const existingTarget = await getTarget(targetId);

  // Prepare update data
  const updateData: any = {};

  if (updates.target_value !== undefined) {
    if (updates.target_value <= 0) {
      throw new Error('Target value must be greater than 0');
    }
    updateData.target_value = updates.target_value;
  }

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  if (updates.assignment_notes !== undefined) {
    updateData.assignment_notes = updates.assignment_notes;
  }

  if (updates.priority_level !== undefined) {
    updateData.priority_level = updates.priority_level;
  }

  if (updates.period_end_date !== undefined) {
    const startDate = new Date(existingTarget.period_start_date);
    const endDate = new Date(updates.period_end_date);

    if (endDate < startDate) {
      throw new Error('Period end date must be after start date');
    }
    updateData.period_end_date = updates.period_end_date;
  }

  // Perform update
  const { data: target, error } = await db
    .from('hospital_marketing_targets')
    .update(updateData)
    .eq('id', targetId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update target: ${error.message}`);
  }

  // Get updated progress
  const progress = await getTargetProgress(targetId);
  const progressHistory = await getTargetProgressHistory(targetId);

  return {
    ...target,
    achieved_value: progress.achieved_value,
    achievement_percentage: progress.achievement_percentage,
    remaining_value: progress.remaining_value,
    days_remaining: calculateDaysRemaining(target.period_end_date),
    is_on_track: calculateOnTrackStatus(
      progress.achievement_percentage,
      target.period_start_date,
      target.period_end_date
    ),
    progress_history: progressHistory
  };
}

/**
 * Delete/cancel a target
 */
export async function deleteTarget(targetId: string): Promise<void> {
  const { error } = await db
    .from('hospital_marketing_targets')
    .update({ status: 'cancelled' })
    .eq('id', targetId);

  if (error) {
    throw new Error(`Failed to cancel target: ${error.message}`);
  }
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Get current progress for a target
 */
export async function getTargetProgress(targetId: string): Promise<{
  achieved_value: number;
  pending_value: number;
  achievement_percentage: number;
  remaining_value: number;
}> {
  const { data: progress, error } = await db
    .from('hospital_marketing_target_progress')
    .select('*')
    .eq('target_id', targetId)
    .eq('progress_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch progress: ${error.message}`);
  }

  if (!progress) {
    // Return zero progress if no record exists
    return {
      achieved_value: 0,
      pending_value: 0,
      achievement_percentage: 0,
      remaining_value: 0
    };
  }

  return {
    achieved_value: progress.achieved_value,
    pending_value: progress.pending_value,
    achievement_percentage: progress.achievement_percentage,
    remaining_value: progress.pending_value
  };
}

/**
 * Get progress history for a target
 */
export async function getTargetProgressHistory(targetId: string, days: number = 30): Promise<TargetProgress[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: history, error } = await db
    .from('hospital_marketing_target_progress')
    .select('*')
    .eq('target_id', targetId)
    .gte('progress_date', startDate.toISOString().split('T')[0])
    .order('progress_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch progress history: ${error.message}`);
  }

  return history || [];
}

/**
 * Get executive progress overview
 */
export async function getExecutiveProgressOverview(executiveId: string): Promise<{
  executive_id: string;
  executive_name: string;
  current_month: {
    targets_assigned: number;
    targets_achieved: number;
    overall_achievement_percentage: number;
  };
  target_breakdown: Array<{
    target_type: string;
    target_name: string;
    target_value: number;
    achieved_value: number;
    achievement_percentage: number;
    status: string;
    days_remaining: number;
  }>;
  daily_progress: Array<{
    date: string;
    total_achievements: number;
    target_achievement: number;
  }>;
}> {
  // Get executive details
  const { data: executive, error: execError } = await db
    .from('hospital_marketing_executives')
    .select('id, name')
    .eq('id', executiveId)
    .single();

  if (execError || !executive) {
    throw new Error('Executive not found');
  }

  // Get current month targets
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const targets = await getTargets({
    executive_id: executiveId,
    period_start: startOfMonth.toISOString().split('T')[0],
    period_end: endOfMonth.toISOString().split('T')[0],
    include_progress: true
  });

  // Calculate month summary
  const targetsAssigned = targets.length;
  const targetsAchieved = targets.filter(t => t.achievement_percentage >= 100).length;
  const overallAchievement = targets.length > 0
    ? targets.reduce((sum, t) => sum + t.achievement_percentage, 0) / targets.length
    : 0;

  // Get daily progress for current month
  const dailyProgress = await getDailyProgress(executiveId, startOfMonth, currentDate);

  return {
    executive_id: executiveId,
    executive_name: executive.name,
    current_month: {
      targets_assigned: targetsAssigned,
      targets_achieved: targetsAchieved,
      overall_achievement_percentage: overallAchievement
    },
    target_breakdown: targets.map(target => ({
      target_type: target.target_type,
      target_name: target.target_name,
      target_value: target.target_value,
      achieved_value: target.achieved_value,
      achievement_percentage: target.achievement_percentage,
      status: target.status,
      days_remaining: target.days_remaining
    })),
    daily_progress: dailyProgress
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate days remaining for a target
 */
function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate if target is on track
 */
function calculateOnTrackStatus(
  achievementPercentage: number,
  startDate: string,
  endDate: string
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const timeElapsedPercentage = (daysElapsed / totalDays) * 100;

  return achievementPercentage >= timeElapsedPercentage;
}

/**
 * Get daily progress data
 */
async function getDailyProgress(executiveId: string, startDate: Date, endDate: Date): Promise<Array<{
  date: string;
  total_achievements: number;
  target_achievement: number;
}>> {
  const { data: dailyData, error } = await db
    .from('hospital_marketing_target_progress')
    .select('progress_date, achieved_value')
    .eq('executive_id', executiveId)
    .gte('progress_date', startDate.toISOString().split('T')[0])
    .lte('progress_date', endDate.toISOString().split('T')[0])
    .order('progress_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch daily progress: ${error.message}`);
  }

  return (dailyData || []).map(day => ({
    date: day.progress_date,
    total_achievements: day.achieved_value,
    target_achievement: 0 // Will be calculated based on total targets
  }));
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate target period
 */
export function validateTargetPeriod(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Validate target value
 */
export function validateTargetValue(value: number): boolean {
  return value > 0;
}

/**
 * Check if target type is valid
 */
export function isValidTargetType(type: string): boolean {
  const validTypes = ['hospital_visits', 'doctor_visits', 'corporate_visits', 'referral_meetings', 'patient_referrals', 'custom'];
  return validTypes.includes(type);
}