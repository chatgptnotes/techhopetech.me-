import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '@/lib/tablet-crm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const notifications = await getNotifications(employeeId, unreadOnly);

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('notificationId');
    const action = searchParams.get('action');
    const employeeId = searchParams.get('employeeId');

    if (action === 'markAllRead') {
      if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
      }
      await markAllNotificationsRead(employeeId);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } else {
      if (!notificationId) {
        return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
      }
      const notification = await markNotificationRead(notificationId);
      return NextResponse.json({ success: true, data: notification });
    }
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification', details: error.message },
      { status: 500 }
    );
  }
}
