// Bulk Target Assignment API Route
// Handles bulk creation of targets for multiple executives

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as targetManagement from '@/lib/target-management';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
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
    const requiredFields = ['executive_ids', 'target_type', 'target_value', 'period_start_date', 'period_end_date'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    if (!Array.isArray(body.executive_ids) || body.executive_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'executive_ids must be a non-empty array'
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

    // Generate target name if not provided
    const targetName = body.target_name || getDefaultTargetName(body.target_type);

    // Validate period dates
    if (!targetManagement.validateTargetPeriod(body.period_start_date, body.period_end_date)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid period dates'
      }, { status: 400 });
    }

    // Create targets for all executives
    const createdTargets = [];
    const failedAssignments = [];

    for (const executiveId of body.executive_ids) {
      try {
        const targetData = {
          executive_id: executiveId,
          target_type: body.target_type,
          target_name: targetName,
          target_value: body.target_value,
          target_period: body.target_period || 'monthly',
          period_start_date: body.period_start_date,
          period_end_date: body.period_end_date,
          priority_level: body.priority_level || 'medium',
          assignment_notes: body.assignment_notes,
          assigned_by: body.assigned_by || user.id,
          status: 'active'
        };

        const target = await targetManagement.createTarget(targetData);
        createdTargets.push(target);
      } catch (error) {
        console.error(`Failed to create target for executive ${executiveId}:`, error);
        failedAssignments.push({ executive_id: executiveId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created_targets: createdTargets.length,
        executives_affected: createdTargets.map(t => t.executive_id),
        failed_assignments: failedAssignments
      },
      message: `Successfully created ${createdTargets.length} targets`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating bulk targets:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create bulk targets'
    }, { status: 500 });
  }
}

/**
 * Get default target name for target type
 */
function getDefaultTargetName(targetType: string): string {
  const targetNames = {
    hospital_visits: 'Hospital Visits',
    doctor_visits: 'Doctor Visits',
    corporate_visits: 'Corporate Visits',
    referral_meetings: 'Referral Meetings',
    patient_referrals: 'Patient Referrals',
    lead_generation: 'Lead Generation',
    lead_conversion: 'Lead Conversion',
    custom: 'Custom Target'
  };

  return targetNames[targetType] || 'Custom Target';
}