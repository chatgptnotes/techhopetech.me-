// Individual Target Management API Routes
// Handles update and delete operations for specific targets

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as targetManagement from '@/lib/target-management';

// ============================================================================
// GET /api/hopetech/marketing/targets/[targetId] - Get specific target
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);

    // Get target
    const target = await targetManagement.getTarget(params.targetId);

    // Check access permissions
    if (user.role === 'marketing_executive') {
      const executiveId = await getExecutiveUserId(user.id);
      if (!executiveId || executiveId !== target.executive_id) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions to view this target'
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: target
    });

  } catch (error: any) {
    console.error('Error fetching target:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch target'
    }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}

// ============================================================================
// PUT /api/hopetech/marketing/targets/[targetId] - Update target
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    // Authenticate and authorize
    const user = await authenticateUser(request);

    if (user.role === 'marketing_executive') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update targets'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate update data
    if (body.target_value !== undefined && body.target_value <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Target value must be greater than 0'
      }, { status: 400 });
    }

    if (body.period_end_date !== undefined) {
      const existingTarget = await targetManagement.getTarget(params.targetId);
      if (!targetManagement.validateTargetPeriod(existingTarget.period_start_date, body.period_end_date)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid period end date'
        }, { status: 400 });
      }
    }

    // Update target
    const updatedTarget = await targetManagement.updateTarget(params.targetId, body);

    return NextResponse.json({
      success: true,
      data: updatedTarget,
      message: 'Target updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating target:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update target'
    }, { status: error.message.includes('not found') ? 404 : 500 });
  }
}

// ============================================================================
// DELETE /api/hopetech/marketing/targets/[targetId] - Cancel target
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    // Authenticate and authorize
    const user = await authenticateUser(request);

    if (user.role === 'marketing_executive') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to cancel targets'
      }, { status: 403 });
    }

    // Delete (cancel) target
    await targetManagement.deleteTarget(params.targetId);

    return NextResponse.json({
      success: true,
      message: 'Target cancelled successfully'
    });

  } catch (error: any) {
    console.error('Error cancelling target:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to cancel target'
    }, { status: error.message.includes('not found') ? 404 : 500 });
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