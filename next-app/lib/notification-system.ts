// Smart Notification System for HopeTech Hospital Marketing CRM
// Generates and delivers target-based performance notifications

import { db } from '@/lib/supabase-admin';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Notification {
  id: string;
  executive_id: string;
  target_id?: string;
  notification_type: 'target_behind_schedule' | 'mid_month_alert' | 'deadline_approaching' | 'monthly_completion' | 'underperformer_alert';
  title: string;
  message: string;
  priority_level: 'high' | 'medium' | 'low';
  channels: Array<'in_app' | 'email' | 'sms' | 'whatsapp'>;
  trigger_percentage?: number;
  trigger_date?: string;
  trigger_days_remaining?: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduled_for?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRule {
  rule_type: string;
  trigger_condition: (data: any) => boolean;
  notification_template: (data: any) => NotificationTemplate;
  priority_level: 'high' | 'medium' | 'low';
  channels: Array<'in_app' | 'email' | 'sms' | 'whatsapp'>;
}

export interface NotificationTemplate {
  title: string;
  message: string;
  priority_level: 'high' | 'medium' | 'low';
  channels: Array<'in_app' | 'email' | 'sms' | 'whatsapp'>;
}

export interface TargetProgressData {
  target_id: string;
  executive_id: string;
  target_type: string;
  target_name: string;
  target_value: number;
  achieved_value: number;
  achievement_percentage: number;
  period_start_date: string;
  period_end_date: string;
  days_remaining: number;
  is_on_track: boolean;
}

// ============================================================================
// NOTIFICATION RULES
// ============================================================================

/**
 * Smart notification rules for target performance
 */
export const notificationRules: NotificationRule[] = [
  // Rule 1: Target Behind Schedule
  {
    rule_type: 'target_behind_schedule',
    trigger_condition: (data: any) => {
      const progress = data.targetProgress;
      const daysElapsed = data.daysElapsed;
      const totalDays = data.totalDays;
      const timeElapsed = daysElapsed / totalDays;
      const progressExpected = timeElapsed * 100;

      // Trigger if behind by more than 20% of expected progress
      return progress.achievement_percentage < (progressExpected - 20) && progress.achievement_percentage < 100;
    },
    notification_template: (data: any) => ({
      title: `Behind Schedule: ${data.target.target_name}`,
      message: `You've achieved ${data.targetProgress.achievement_percentage.toFixed(1)}% of your target, but you should be at ${((data.daysElapsed / data.totalDays) * 100).toFixed(1)}%. Catch up to stay on track!`,
      priority_level: 'high',
      channels: ['in_app', 'whatsapp']
    }),
    priority_level: 'high',
    channels: ['in_app', 'whatsapp']
  },

  // Rule 2: Mid-Month Alert (if <50% achieved)
  {
    rule_type: 'mid_month_alert',
    trigger_condition: (data: any) => {
      const currentDay = new Date().getDate();
      const daysInMonth = new Date(data.currentYear, data.currentMonth + 1, 0).getDate();
      const isMidMonth = currentDay >= daysInMonth / 2;

      return isMidMonth && data.targetProgress.achievement_percentage < 50 && data.targetProgress.achievement_percentage < 100;
    },
    notification_template: (data: any) => ({
      title: `Mid-Month Alert: ${data.target.target_name}`,
      message: `You're halfway through the month with ${data.targetProgress.achievement_percentage.toFixed(1)}% achievement. Push harder to reach your ${data.target.target_value} target!`,
      priority_level: 'medium',
      channels: ['in_app', 'email']
    }),
    priority_level: 'medium',
    channels: ['in_app', 'email']
  },

  // Rule 3: Deadline Approaching (3 days before)
  {
    rule_type: 'deadline_approaching',
    trigger_condition: (data: any) => {
      return data.targetProgress.days_remaining <= 3 && data.targetProgress.days_remaining >= 0 && data.targetProgress.achievement_percentage < 100;
    },
    notification_template: (data: any) => ({
      title: `Deadline Approaching: ${data.target.target_name}`,
      message: `Only ${data.targetProgress.days_remaining} days left! You've achieved ${data.targetProgress.achievement_percentage.toFixed(1)}% of your target. ${data.targetProgress.remaining_value} more to go!`,
      priority_level: 'high',
      channels: ['in_app', 'sms', 'whatsapp']
    }),
    priority_level: 'high',
    channels: ['in_app', 'sms', 'whatsapp']
  },

  // Rule 4: Monthly Completion Report
  {
    rule_type: 'monthly_completion',
    trigger_condition: (data: any) => {
      const lastDayOfMonth = new Date(data.currentYear, data.currentMonth + 1, 0).getDate();
      const currentDay = new Date().getDate();
      return currentDay === lastDayOfMonth && data.targetProgress.achievement_percentage >= 100;
    },
    notification_template: (data: any) => ({
      title: `Target Achieved: ${data.target.target_name}`,
      message: `Congratulations! You've achieved ${data.target.target_value} ${data.target.target_type === 'hospital_visits' ? 'visits' : 'referrals'} this month. Great work!`,
      priority_level: 'medium',
      channels: ['in_app', 'email']
    }),
    priority_level: 'medium',
    channels: ['in_app', 'email']
  },

  // Rule 5: Underperformer Alert (Management only)
  {
    rule_type: 'underperformer_alert',
    trigger_condition: (data: any) => {
      return data.performanceScore.total_performance_score < 50 && data.performanceScore.total_performance_score > 0;
    },
    notification_template: (data: any) => ({
      title: `Performance Alert: ${data.executive.name}`,
      message: `${data.executive.name} has a performance score of ${data.performanceScore.total_performance_score.toFixed(1)}/100 (${data.performanceScore.performance_category}). Consider intervention and support.`,
      priority_level: 'high',
      channels: ['in_app', 'email']
    }),
    priority_level: 'high',
    channels: ['in_app', 'email']
  }
];

// ============================================================================
// NOTIFICATION GENERATION
// ============================================================================

/**
 * Generate notifications for target performance
 */
export async function generateTargetNotifications(
  executiveIds?: string[]
): Promise<Notification[]> {
  const generatedNotifications: Notification[] = [];

  // Get all active targets
  let targetsQuery = db
    .from('hospital_marketing_targets')
    .select('*, hospital_marketing_executives(id, name)')
    .eq('status', 'active');

  if (executiveIds && executiveIds.length > 0) {
    targetsQuery = targetsQuery.in('executive_id', executiveIds);
  }

  const { data: targets, error: targetsError } = await targetsQuery;

  if (targetsError || !targets) {
    throw new Error(`Failed to fetch targets: ${targetsError?.message}`);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const target of (targets as any[])) {
    // Get current progress
    const progress = await getTargetProgress(target.id);

    // Calculate time context
    const daysElapsed = Math.ceil(
      (now.getTime() - new Date(target.period_start_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (new Date(target.period_end_date).getTime() - new Date(target.period_start_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Build trigger data for each rule
    const triggerData = {
      target: target,
      targetProgress: progress,
      daysElapsed: daysElapsed,
      totalDays: totalDays,
      currentYear: currentYear,
      currentMonth: currentMonth
    };

    // Check each notification rule
    for (const rule of notificationRules) {
      // Skip underperformer_alert (for management only)
      if (rule.rule_type === 'underperformer_alert') continue;

      try {
        if (rule.trigger_condition(triggerData)) {
          const template = rule.notification_template(triggerData);

          const notification = await createNotification({
            executive_id: target.executive_id,
            target_id: target.id,
            notification_type: rule.rule_type as any,
            notification_title: template.title,
            notification_message: template.message,
            priority_level: template.priority_level,
            notification_channels: template.channels
          });

          generatedNotifications.push(notification);
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.rule_type}:`, error);
      }
    }
  }

  return generatedNotifications;
}

/**
 * Generate management notifications for underperformers
 */
export async function generateManagementNotifications(
  periodStart?: string,
  periodEnd?: string
): Promise<Notification[]> {
  const managementNotifications: Notification[] = [];

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

  // Get all management users
  const { data: managementUsers, error: mgmtError } = await db
    .from('user_roles')
    .select('user_id')
    .in('role', ['admin', 'manager']);

  if (mgmtError || !managementUsers) {
    throw new Error(`Failed to fetch management users: ${mgmtError?.message}`);
  }

  // Get executive profiles for underperformers
  const { data: underperformers, error: perfError } = await db
    .from('hospital_marketing_performance_scores')
    .select(`
      executive_id,
      total_performance_score,
      performance_category,
      hospital_marketing_executives (
        id,
        name,
        user_id
      )
    `)
    .eq('score_period', 'monthly')
    .eq('period_start_date', periodStart)
    .eq('period_end_date', periodEnd)
    .lt('total_performance_score', 50);

  if (perfError) {
    throw new Error(`Failed to fetch performance data: ${perfError.message}`);
  }

  // Generate notifications for each underperformer
  for (const underperformer of (underperformers || [])) {
    const executive = (underperformer as any).hospital_marketing_executives;

    if (!executive) continue;

    for (const manager of managementUsers) {
      try {
        const notification = await createNotification({
          executive_id: manager.user_id, // Manager's user ID
          target_id: null,
          notification_type: 'underperformer_alert',
          notification_title: `Performance Alert: ${executive.name}`,
          notification_message: `${executive.name} has a performance score of ${(underperformer as any).total_performance_score.toFixed(1)}/100 (${(underperformer as any).performance_category}). Consider intervention and support.`,
          priority_level: 'high',
          notification_channels: ['in_app', 'email']
        });

        managementNotifications.push(notification);
      } catch (error) {
        console.error('Error creating management notification:', error);
      }
    }
  }

  return managementNotifications;
}

/**
 * Get notifications for an executive
 */
export async function getNotifications(
  executiveId: string,
  options: {
    status?: 'pending' | 'sent' | 'read';
    notification_type?: string;
    limit?: number;
  } = {}
): Promise<{
  notifications: Notification[];
  unread_count: number;
}> {
  let query = db
    .from('hospital_marketing_target_notifications')
    .select('*')
    .eq('executive_id', executiveId);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.notification_type) {
    query = query.eq('notification_type', options.notification_type);
  }

  query = query.order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data: notifications, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  // Get unread count
  const { count: unreadCount } = await db
    .from('hospital_marketing_target_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('executive_id', executiveId)
    .in('status', ['pending', 'sent']);

  return {
    notifications: (notifications || []) as Notification[],
    unread_count: unreadCount || 0
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await db
    .from('hospital_marketing_target_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}

/**
 * Mark all notifications as read for an executive
 */
export async function markAllNotificationsAsRead(executiveId: string): Promise<void> {
  const { error } = await db
    .from('hospital_marketing_target_notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString()
    })
    .eq('executive_id', executiveId)
    .in('status', ['pending', 'sent']);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
}

// ============================================================================
// NOTIFICATION DELIVERY
// ============================================================================

/**
 * Deliver notification via specified channels
 */
export async function deliverNotification(notification: Notification): Promise<boolean> {
  let deliverySuccess = true;

  for (const channel of notification.channels as Array<'in_app' | 'email' | 'sms' | 'whatsapp'>) {
    try {
      switch (channel) {
        case 'in_app':
          await deliverInAppNotification(notification);
          break;
        case 'email':
          await deliverEmailNotification(notification);
          break;
        case 'sms':
          await deliverSMSNotification(notification);
          break;
        case 'whatsapp':
          await deliverWhatsAppNotification(notification);
          break;
      }
    } catch (error) {
      console.error(`Failed to deliver notification via ${channel}:`, error);
      deliverySuccess = false;
    }
  }

  // Update notification status
  await db
    .from('hospital_marketing_target_notifications')
    .update({
      status: deliverySuccess ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      delivery_attempts: (notification as any).delivery_attempts + 1
    })
    .eq('id', notification.id);

  return deliverySuccess;
}

/**
 * Deliver in-app notification
 */
async function deliverInAppNotification(notification: Notification): Promise<void> {
  // Store in database for real-time retrieval
  // Already stored when created, so this is for any additional processing

  // Send real-time push notification via WebSocket if available
  // This would integrate with your real-time system
  console.log(`In-app notification sent to executive ${notification.executive_id}`);
}

/**
 * Deliver email notification
 */
async function deliverEmailNotification(notification: Notification): Promise<void> {
  // Get executive details
  const { data: executive } = await db
    .from('hospital_marketing_executives')
    .select('email, phone')
    .eq('id', notification.executive_id)
    .single();

  if (!executive?.email) {
    console.warn('No email found for executive:', notification.executive_id);
    return;
  }

  // Email template
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10233f;">${notification.title}</h2>
      <p>${notification.message}</p>
      <p style="color: #64748b; font-size: 12px;">This is an automated message from HopeTech CRM.</p>
    </div>
  `;

  // Integrate with your email service (e.g., SendGrid, AWS SES)
  console.log(`Email sent to ${executive.email}: ${notification.title}`);

  // Example: await sendEmail({ to: executive.email, subject: notification.title, html: emailTemplate });
}

/**
 * Deliver SMS notification
 */
async function deliverSMSNotification(notification: Notification): Promise<void> {
  // Get executive details
  const { data: executive } = await db
    .from('hospital_marketing_executives')
    .select('phone')
    .eq('id', notification.executive_id)
    .single();

  if (!executive?.phone) {
    console.warn('No phone found for executive:', notification.executive_id);
    return;
  }

  const smsMessage = `${notification.title}\n\n${notification.message}`;

  // Integrate with your SMS service (e.g., Twilio)
  console.log(`SMS sent to ${executive.phone}: ${notification.title}`);

  // Example: await sendSMS({ to: executive.phone, message: smsMessage });
}

/**
 * Deliver WhatsApp notification
 */
async function deliverWhatsAppNotification(notification: Notification): Promise<void> {
  // Get executive details
  const { data: executive } = await db
    .from('hospital_marketing_executives')
    .select('phone, whatsapp_enabled')
    .eq('id', notification.executive_id)
    .single();

  if (!executive?.phone || !executive.whatsapp_enabled) {
    console.warn('WhatsApp not available for executive:', notification.executive_id);
    return;
  }

  const whatsappMessage = `${notification.title}\n\n${notification.message}`;

  // Integrate with your WhatsApp service (e.g., Twilio WhatsApp API)
  console.log(`WhatsApp sent to ${executive.phone}: ${notification.title}`);

  // Example: await sendWhatsAppMessage({ to: executive.phone, message: whatsappMessage });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get target progress
 */
async function getTargetProgress(targetId: string): Promise<{
  achieved_value: number;
  achievement_percentage: number;
  remaining_value: number;
  days_remaining: number;
}> {
  const { data: progress, error } = await db
    .from('hospital_marketing_target_progress')
    .select('*')
    .eq('target_id', targetId)
    .eq('progress_date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  if (error || !progress) {
    // Return zero progress if no record exists
    return {
      achieved_value: 0,
      achievement_percentage: 0,
      remaining_value: 0,
      days_remaining: 0
    };
  }

  // Get target to calculate days remaining
  const { data: target } = await db
    .from('hospital_marketing_targets')
    .select('period_end_date')
    .eq('id', targetId)
    .single();

  const daysRemaining = target ? Math.ceil(
    (new Date(target.period_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;

  return {
    achieved_value: progress.achieved_value,
    achievement_percentage: progress.achievement_percentage,
    remaining_value: progress.pending_value,
    days_remaining: Math.max(0, daysRemaining)
  };
}

/**
 * Create notification in database
 */
async function createNotification(data: {
  executive_id: string;
  target_id?: string | null;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  priority_level: string;
  notification_channels: Array<'in_app' | 'email' | 'sms' | 'whatsapp'>;
}): Promise<Notification> {
  const { data: notification, error } = await db
    .from('hospital_marketing_target_notifications')
    .insert({
      executive_id: data.executive_id,
      target_id: data.target_id,
      notification_type: data.notification_type,
      notification_title: data.notification_title,
      notification_message: data.notification_message,
      priority_level: data.priority_level,
      notification_channel: data.notification_channels[0], // Primary channel
      status: 'pending',
      scheduled_for: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !notification) {
    throw new Error(`Failed to create notification: ${error?.message}`);
  }

  // Attach additional channels to the notification object for delivery
  return {
    ...notification,
    channels: data.notification_channels
  } as Notification;
}