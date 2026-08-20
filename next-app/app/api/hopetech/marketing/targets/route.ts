// Target Management API Routes
// Handles CRUD operations for marketing executive targets

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as targetManagement from '@/lib/target-management';

// ============================================================================
// GET /api/hopetech/marketing/targets - Get targets with optional filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dashboardSummary = searchParams.get('dashboard-summary') === 'true';
    const managementSummary = searchParams.get('management-summary') === 'true';

    // Handle dashboard summary request
    if (dashboardSummary) {
      return await getDashboardSummary(searchParams, user);
    }

    // Handle management summary request
    if (managementSummary) {
      return await getManagementSummary(searchParams, user);
    }

    const filters = {
      executive_id: searchParams.get('executive_id') || undefined,
      target_type: searchParams.get('target_type') || undefined,
      status: searchParams.get('status') || undefined,
      period_start: searchParams.get('period_start') || undefined,
      period_end: searchParams.get('period_end') || undefined,
      include_progress: searchParams.get('include_progress') === 'true'
    };

    // Apply role-based filtering
    if (user.role === 'marketing_executive') {
      // Executives can only see their own targets
      const executiveId = await getExecutiveUserId(user.id);
      if (!executiveId) {
        return NextResponse.json({
          success: false,
          error: 'Executive profile not found'
        }, { status: 404 });
      }
      filters.executive_id = executiveId;
    }

    // Get targets
    const targets = await targetManagement.getTargets(filters);

    return NextResponse.json({
      success: true,
      data: targets,
      count: targets.length
    });

  } catch (error: any) {
    console.error('Error fetching targets:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch targets'
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/hopetech/marketing/targets - Create new target
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize (only admins/managers can create targets)
    const user = await authenticateUser(request);

    if (user.role === 'marketing_executive') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to create targets'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['executive_id', 'target_type', 'target_name', 'target_value', 'target_period', 'period_start_date', 'period_end_date'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate target type
    if (!targetManagement.isValidTargetType(body.target_type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid target type'
      }, { status: 400 });
    }

    // Validate target value
    if (!targetManagement.validateTargetValue(body.target_value)) {
      return NextResponse.json({
        success: false,
        error: 'Target value must be greater than 0'
      }, { status: 400 });
    }

    // Validate period dates
    if (!targetManagement.validateTargetPeriod(body.period_start_date, body.period_end_date)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid period dates'
      }, { status: 400 });
    }

    // Create target
    const target = await targetManagement.createTarget(body);

    return NextResponse.json({
      success: true,
      data: target,
      message: 'Target created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating target:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create target'
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get executive ID from user ID
 */
async function getExecutiveUserId(userId: string): Promise<string | null> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('hospital_marketing_executives')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'Active')
    .maybeSingle();

  return data?.id || null;
}

/**
 * Get dashboard summary for executive
 */
async function getDashboardSummary(searchParams: URLSearchParams, user: any) {
  try {
    const executiveId = searchParams.get('executiveId');
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // Format: 2026-08

    if (!executiveId) {
      return NextResponse.json({
        success: false,
        error: 'Executive ID is required'
      }, { status: 400 });
    }

    // Role-based access check
    if (user.role === 'marketing_executive') {
      const executiveUserId = await getExecutiveUserId(user.id);
      if (executiveUserId !== executiveId) {
        return NextResponse.json({
          success: false,
          error: 'Access denied - can only view own targets'
        }, { status: 403 });
      }
    }

    // Get targets for the period
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate period start and end dates
    const [year, month] = period.split('-');
    const startDate = `${period}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${period}-${lastDay.toString().padStart(2, '0')}`;

    // Fetch targets with progress
    const { data: targets, error } = await supabase
      .from('hospital_marketing_targets')
      .select(`
        id,
        target_type,
        target_name,
        target_value,
        target_period,
        period_start_date,
        period_end_date,
        priority_level,
        status,
        hospital_marketing_target_progress (
          completed_value,
          achievement_percent,
          last_updated
        )
      `)
      .eq('executive_id', executiveId)
      .eq('status', 'active')
      .gte('period_start_date', startDate)
      .lte('period_end_date', endDate);

    if (error) {
      throw error;
    }

    // Calculate daily progress for each target
    const targetsWithProgress = await Promise.all((targets || []).map(async (target: any) => {
      const progress = target.hospital_marketing_target_progress?.[0] || {};
      const completedValue = progress.completed_value || 0;
      const achievementPercent = progress.achievement_percent || 0;

      // Calculate days remaining
      const today = new Date();
      const endDateObj = new Date(target.period_end_date);
      const daysRemaining = Math.max(0, Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Calculate status
      const daysElapsed = Math.min(
        Math.ceil((today.getTime() - new Date(target.period_start_date).getTime()) / (1000 * 60 * 60 * 24)),
        parseInt(target.target_period === 'monthly' ? '30' : target.target_period === 'quarterly' ? '90' : '7')
      );
      const expectedProgress = (daysElapsed / 30) * 100; // Assume 30-day month
      let status = 'on_track';
      if (achievementPercent >= expectedProgress + 10) status = 'ahead';
      else if (achievementPercent < expectedProgress - 10) status = 'behind';

      // Generate daily progress data
      const dailyProgress = await generateDailyProgress(executiveId, target.id, target.period_start_date, target.period_end_date);

      return {
        targetId: target.id,
        targetType: target.target_type,
        targetName: target.target_name,
        targetValue: target.target_value,
        completedValue: completedValue,
        achievementPercent: Math.round(achievementPercent),
        status: status,
        daysRemaining: daysRemaining,
        periodStart: target.period_start_date,
        periodEnd: target.period_end_date,
        dailyProgress: dailyProgress
      };
    }));

    // Calculate overall achievement
    const totalTargets = targetsWithProgress.length;
    const overallAchievement = totalTargets > 0
      ? Math.round(targetsWithProgress.reduce((sum, t) => sum + t.achievementPercent, 0) / totalTargets)
      : 0;

    // Calculate overall status
    const onTrackCount = targetsWithProgress.filter(t => t.status === 'on_track' || t.status === 'ahead').length;
    let overallStatus = 'on_track';
    if (overallAchievement < 50) overallStatus = 'behind';
    else if (onTrackCount === totalTargets && overallAchievement >= 80) overallStatus = 'ahead';

    const summary = {
      executiveId: executiveId,
      period: period,
      summary: {
        totalActiveTargets: totalTargets,
        overallAchievementPercent: overallAchievement,
        status: overallStatus,
        targets: targetsWithProgress
      }
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard summary'
    }, { status: 500 });
  }
}

/**
 * Generate daily progress data for a target
 */
async function generateDailyProgress(executiveId: string, targetId: string, startDate: string, endDate: string): Promise<any[]> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get activity type for this target
    const { data: target } = await supabase
      .from('hospital_marketing_targets')
      .select('target_type')
      .eq('id', targetId)
      .single();

    if (!target) return [];

    // Map target types to activity tables
    const activityTableMap: Record<string, string> = {
      'hospital_visits': 'hospital_marketing_visits',
      'doctor_visits': 'doctor_meetings',
      'corporate_visits': 'corporate_visits',
      'referral_meetings': 'partner_meetings',
      'patient_referrals': 'patient_referrals',
      'lead_generation': 'leads',
      'lead_conversion': 'converted_leads'
    };

    const tableName = activityTableMap[target.target_type];
    if (!tableName) return [];

    // Get daily activity counts
    const { data: activities } = await supabase
      .from(tableName)
      .select('created_at')
      .eq('executive_id', executiveId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    // Aggregate by day
    const dailyMap = new Map<string, number>();
    const today = new Date();

    // Initialize all days with 0
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate) && currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count activities per day
    (activities || []).forEach((activity: any) => {
      const dateStr = new Date(activity.created_at).toISOString().split('T')[0];
      const currentCount = dailyMap.get(dateStr) || 0;
      dailyMap.set(dateStr, currentCount + 1);
    });

    // Convert to array with cumulative totals
    let cumulative = 0;
    return Array.from(dailyMap.entries()).map(([date, value]) => {
      cumulative += value;
      return { date, value: cumulative };
    });

  } catch (error) {
    console.error('Error generating daily progress:', error);
    return [];
  }
}

/**
 * Get management summary for dashboard
 */
async function getManagementSummary(searchParams: URLSearchParams, user: any) {
  try {
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7); // Format: 2026-08

    // Calculate period start and end dates
    const [year, month] = period.split('-');
    const startDate = `${period}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${period}-${lastDay.toString().padStart(2, '0')}`;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all executives with their targets and progress
    const { data: executives, error: execError } = await supabase
      .from('hospital_marketing_executives')
      .select('id, full_name, designation, status')
      .eq('status', 'Active');

    if (execError) throw execError;

    // Get targets for all executives
    const executiveIds = executives.map(e => e.id);
    const { data: targets, error: targetError } = await supabase
      .from('hospital_marketing_targets')
      .select(`
        id,
        executive_id,
        target_type,
        target_name,
        target_value,
        target_period,
        period_start_date,
        period_end_date,
        priority_level,
        status,
        hospital_marketing_target_progress (
          completed_value,
          achievement_percent,
          last_updated
        )
      `)
      .in('executive_id', executiveIds)
      .eq('status', 'active')
      .gte('period_start_date', startDate)
      .lte('period_end_date', endDate);

    if (targetError) throw targetError;

    // Group targets by executive
    const targetsByExecutive = new Map();
    (executives || []).forEach(exec => {
      targetsByExecutive.set(exec.id, {
        executive_id: exec.id,
        executive_name: exec.full_name,
        targets: []
      });
    });

    // Process targets and calculate summary
    let totalAchievement = 0;
    let executivesOnTrack = 0;
    let executivesBehind = 0;
    const topPerformers = [];
    const needsAttention = [];

    (targets || []).forEach((target: any) => {
      const progress = target.hospital_marketing_target_progress?.[0] || {};
      const completedValue = progress.completed_value || 0;
      const achievementPercent = progress.achievement_percent || 0;

      // Calculate days remaining
      const today = new Date();
      const endDateObj = new Date(target.period_end_date);
      const daysRemaining = Math.max(0, Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      // Calculate status
      const daysElapsed = Math.min(
        Math.ceil((today.getTime() - new Date(target.period_start_date).getTime()) / (1000 * 60 * 60 * 24)),
        30
      );
      const expectedProgress = (daysElapsed / 30) * 100;
      let status = 'on_track';
      if (achievementPercent >= expectedProgress + 10) status = 'ahead';
      else if (achievementPercent < expectedProgress - 10) status = 'behind';

      const targetData = {
        id: target.id,
        target_type: target.target_type,
        target_name: target.target_name,
        target_value: target.target_value,
        achieved_value: completedValue,
        achievement_percent: Math.round(achievementPercent),
        status: status,
        period: period,
        days_remaining: daysRemaining
      };

      // Add to executive's targets
      const execTargets = targetsByExecutive.get(target.executive_id);
      if (execTargets) {
        execTargets.targets.push(targetData);
        totalAchievement += achievementPercent;

        // Track executive status
        if (status === 'behind') {
          executivesBehind++;
          if (!needsAttention.includes(target.executive_id)) {
            needsAttention.push(target.executive_id);
          }
        } else if (status === 'ahead' || status === 'on_track') {
          executivesOnTrack++;
        }
      }
    });

    // Convert map to array and calculate averages
    const targetsArray = Array.from(targetsByExecutive.values()).filter(exec => exec.targets.length > 0);
    const totalActiveTargets = targetsArray.reduce((sum, exec) => sum + exec.targets.length, 0);
    const overallAchievement = totalActiveTargets > 0 ? Math.round(totalAchievement / totalActiveTargets) : 0;

    // Identify top performers (executives with highest achievement)
    const execAchievements = targetsArray.map(exec => ({
      id: exec.executive_id,
      name: exec.executive_name,
      avgAchievement: exec.targets.reduce((sum, t) => sum + t.achievement_percent, 0) / exec.targets.length
    })).sort((a, b) => b.avgAchievement - a.avgAchievement);

    const topPerformers = execAchievements.slice(0, 3).map(e => e.id);

    const summary = {
      executiveId: user.id,
      period: period,
      team_summary: {
        total_executives: executives.length,
        total_active_targets: totalActiveTargets,
        overall_achievement_percent: overallAchievement,
        executives_on_track: executivesOnTrack,
        executives_behind: executivesBehind,
        top_performers: topPerformers,
        needs_attention: needsAttention
      },
      targets: targetsArray
    };

    return NextResponse.json({
      success: true,
      data: summary
    });

  } catch (error: any) {
    console.error('Error fetching management summary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch management summary'
    }, { status: 500 });
  }
}