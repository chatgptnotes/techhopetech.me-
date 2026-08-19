// Notification System API Routes
// Handles notification generation and retrieval

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as notificationSystem from '@/lib/notification-system';

// ============================================================================
// GET /api/hopetech/marketing/notifications - Get notifications
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);

    // Get executive ID for the user
    const executiveId = await getExecutiveUserId(user.id);
    if (!executiveId) {
      return NextResponse.json({
        success: false,
        error: 'Executive profile not found'
      }, { status: 404 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const options = {
      status: searchParams.get('status') as 'pending' | 'sent' | 'read' | undefined,
      notification_type: searchParams.get('notification_type') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    // Get notifications
    const { notifications, unread_count } = await notificationSystem.getNotifications(executiveId, options);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unread_count
      }
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch notifications'
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/hopetech/marketing/notifications/generate - Generate notifications
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize (only admins/managers can generate notifications)
    const user = await authenticateUser(request);

    if (user.role === 'marketing_executive') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to generate notifications'
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { notification_type, executive_ids, period_start, period_end } = body;

    let notifications: any[] = [];

    // Generate notifications based on type
    switch (notification_type) {
      case 'target_performance':
        notifications = await notificationSystem.generateTargetNotifications(executive_ids);
        break;

      case 'management_alerts':
        notifications = await notificationSystem.generateManagementNotifications(period_start, period_end);
        break;

      case 'all':
        const targetNotifs = await notificationSystem.generateTargetNotifications(executive_ids);
        const mgmtNotifs = await notificationSystem.generateManagementNotifications(period_start, period_end);
        notifications = [...targetNotifs, ...mgmtNotifs];
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid notification type'
        }, { status: 400 });
    }

    // Deliver notifications asynchronously
    notifications.forEach(notification => {
      notificationSystem.deliverNotification(notification).catch(err => {
        console.error('Failed to deliver notification:', err);
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        generated_count: notifications.length,
        notifications: notifications.map(n => ({
          notification_id: n.id,
          executive_id: n.executive_id,
          notification_type: n.notification_type,
          title: n.notification_title,
          message: n.notification_message,
          priority_level: n.priority_level,
          scheduled_for: n.scheduled_for
        }))
      },
      message: `Generated ${notifications.length} notifications successfully`
    });

  } catch (error: any) {
    console.error('Error generating notifications:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate notifications'
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