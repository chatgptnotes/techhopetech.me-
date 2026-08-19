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