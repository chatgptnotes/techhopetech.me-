import { db } from './supabase-admin';

// Types for the CRM system
export interface MarketingEmployee {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DailyVisitPlan {
  id: string;
  employee_id: string;
  plan_date: string;
  planned_visits: number;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisit {
  id: string;
  plan_id?: string;
  employee_id: string;
  doctor_name: string;
  hospital_clinic_name: string;
  location?: string;
  meeting_time?: string;
  priority_level: string;
  contact_phone?: string;
  contact_email?: string;
  remarks?: string;
  status: string;
  completion_time?: string;
  visit_notes?: string;
  outcome_summary?: string;
  is_additional_visit: boolean;
  created_at: string;
  updated_at: string;
}

export interface VoiceNote {
  id: string;
  visit_id: string;
  employee_id: string;
  audio_url?: string;
  transcription?: string;
  duration?: number;
  recorded_at: string;
  created_at: string;
}

export interface VisitMedia {
  id: string;
  visit_id: string;
  employee_id: string;
  media_type: string;
  file_url: string;
  thumbnail_url?: string;
  file_size?: number;
  duration?: number;
  caption?: string;
  uploaded_at: string;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  visit_id?: string;
  employee_id: string;
  lead_id?: string;
  task_type: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  completed_at?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  employee_id: string;
  lead_name: string;
  organization_name?: string;
  contact_person?: string;
  mobile_number?: string;
  email_address?: string;
  location?: string;
  lead_source?: string;
  lead_type?: string;
  status: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  lead_id?: string;
  employee_id: string;
  opportunity_name: string;
  organization?: string;
  expected_revenue?: number;
  probability?: number;
  next_follow_up_date?: string;
  assigned_executive?: string;
  status: string;
  description?: string;
  closed_date?: string;
  actual_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  employee_id: string;
  notification_type: string;
  title: string;
  message: string;
  related_visit_id?: string;
  related_follow_up_id?: string;
  related_lead_id?: string;
  is_read: boolean;
  priority: string;
  scheduled_for?: string;
  sent_at: string;
  created_at: string;
}

export interface DailyPerformanceMetrics {
  id: string;
  employee_id: string;
  metric_date: string;
  planned_visits: number;
  completed_planned_visits: number;
  additional_visits: number;
  total_visits: number;
  leads_generated: number;
  opportunities_created: number;
  follow_ups_pending: number;
  follow_ups_completed: number;
  productivity_score?: number;
  created_at: string;
  updated_at: string;
}

// Marketing Employees API
export async function getMarketingEmployees() {
  const { data, error } = await db
    .from('marketing_employees')
    .select('*')
    .eq('status', 'active')
    .order('full_name');

  if (error) throw error;
  return data as MarketingEmployee[];
}

export async function getMarketingEmployeeById(id: string) {
  const { data, error } = await db
    .from('marketing_employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as MarketingEmployee;
}

export async function createMarketingEmployee(employee: Partial<MarketingEmployee>) {
  const { data, error } = await db
    .from('marketing_employees')
    .insert([employee])
    .select()
    .single();

  if (error) throw error;
  return data as MarketingEmployee;
}

// Daily Visit Plans API
export async function getDailyVisitPlan(employeeId: string, date: string) {
  const { data, error } = await db
    .from('daily_visit_plans')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('plan_date', date)
    .maybeSingle();

  if (error) throw error;
  return data as DailyVisitPlan | null;
}

export async function createDailyVisitPlan(plan: Partial<DailyVisitPlan>) {
  const { data, error } = await db
    .from('daily_visit_plans')
    .insert([plan])
    .select()
    .single();

  if (error) throw error;
  return data as DailyVisitPlan;
}

export async function updateDailyVisitPlan(id: string, updates: Partial<DailyVisitPlan>) {
  const { data, error } = await db
    .from('daily_visit_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DailyVisitPlan;
}

// Doctor Visits API
export async function getDoctorVisits(employeeId: string, date: string) {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await db
    .from('doctor_visits')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('meeting_time', startOfDay.toISOString())
    .lte('meeting_time', endOfDay.toISOString())
    .order('meeting_time', { ascending: true });

  if (error) throw error;
  return data as DoctorVisit[];
}

export async function getAllDoctorVisits(employeeId: string) {
  const { data, error } = await db
    .from('doctor_visits')
    .select('*')
    .eq('employee_id', employeeId)
    .order('meeting_time', { ascending: false });

  if (error) throw error;
  return data as DoctorVisit[];
}

export async function createDoctorVisit(visit: Partial<DoctorVisit>) {
  const { data, error } = await db
    .from('doctor_visits')
    .insert([visit])
    .select()
    .single();

  if (error) throw error;

  // Update daily plan visit count
  if (visit.plan_id) {
    await updateDailyVisitPlanVisits(visit.plan_id);
  }

  return data as DoctorVisit;
}

export async function updateDoctorVisit(id: string, updates: Partial<DoctorVisit>) {
  const { data, error } = await db
    .from('doctor_visits')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DoctorVisit;
}

export async function markVisitCompleted(id: string) {
  const visit = await getDoctorVisitById(id);
  if (!visit) throw new Error('Visit not found');

  const { data, error } = await db
    .from('doctor_visits')
    .update({
      status: 'completed',
      completion_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Create notification for successful completion
  await createNotification({
    employee_id: visit.employee_id,
    notification_type: 'visit_completed',
    title: 'Visit Completed',
    message: `Successfully completed visit to ${visit.doctor_name} at ${visit.hospital_clinic_name}`,
    related_visit_id: id,
    priority: 'normal'
  });

  return data as DoctorVisit;
}

async function getDoctorVisitById(id: string) {
  const { data } = await db.from('doctor_visits').select('*').eq('id', id).maybeSingle();
  return data as DoctorVisit | null;
}

async function updateDailyVisitPlanVisits(planId: string) {
  const { data: visits } = await db
    .from('doctor_visits')
    .select('id')
    .eq('plan_id', planId);

  if (visits) {
    await db
      .from('daily_visit_plans')
      .update({ planned_visits: visits.length, updated_at: new Date().toISOString() })
      .eq('id', planId);
  }
}

// Voice Notes API
export async function createVoiceNote(note: Partial<VoiceNote>) {
  const { data, error } = await db
    .from('voice_notes')
    .insert([note])
    .select()
    .single();

  if (error) throw error;
  return data as VoiceNote;
}

export async function getVoiceNotesByVisit(visitId: string) {
  const { data, error } = await db
    .from('voice_notes')
    .select('*')
    .eq('visit_id', visitId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return data as VoiceNote[];
}

// Visit Media API
export async function createVisitMedia(media: Partial<VisitMedia>) {
  const { data, error } = await db
    .from('visit_media')
    .insert([media])
    .select()
    .single();

  if (error) throw error;
  return data as VisitMedia;
}

export async function getVisitMediaByVisit(visitId: string) {
  const { data, error } = await db
    .from('visit_media')
    .select('*')
    .eq('visit_id', visitId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data as VisitMedia[];
}

// Follow-Up Tasks API
export async function createFollowUpTask(task: Partial<FollowUpTask>) {
  const { data, error } = await db
    .from('follow_up_tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;

  // Create notification for the follow-up
  if (task.due_date) {
    await createNotification({
      employee_id: task.employee_id,
      notification_type: 'follow_up_reminder',
      title: 'Follow-Up Reminder',
      message: `Reminder: ${task.title} is due on ${new Date(task.due_date).toLocaleDateString()}`,
      related_follow_up_id: data.id,
      scheduled_for: task.due_date,
      priority: task.priority
    });
  }

  return data as FollowUpTask;
}

export async function getFollowUpTasks(employeeId: string, status?: string) {
  let query = db
    .from('follow_up_tasks')
    .select('*')
    .eq('employee_id', employeeId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('due_date', { ascending: true });
  if (error) throw error;

  return data as FollowUpTask[];
}

export async function updateFollowUpTask(id: string, updates: Partial<FollowUpTask>) {
  const { data, error } = await db
    .from('follow_up_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FollowUpTask;
}

export async function completeFollowUpTask(id: string) {
  const { data, error } = await db
    .from('follow_up_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FollowUpTask;
}

// Leads API
export async function createLead(lead: Partial<Lead>) {
  const { data, error } = await db
    .from('leads')
    .insert([lead])
    .select()
    .single();

  if (error) throw error;

  // Create notification for new lead
  await createNotification({
    employee_id: lead.employee_id!,
    notification_type: 'new_lead',
    title: 'New Lead Created',
    message: `New lead "${lead.lead_name}" has been added to your pipeline`,
    related_lead_id: data.id,
    priority: 'normal'
  });

  return data as Lead;
}

export async function getLeads(employeeId?: string, status?: string) {
  let query = db.from('leads').select('*');

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return data as Lead[];
}

export async function getLeadById(id: string) {
  const { data, error } = await db
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await db
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function convertLeadToOpportunity(leadId: string, opportunity: Partial<Opportunity>) {
  // Update lead status
  await updateLead(leadId, { status: 'opportunity_created' });

  // Create opportunity
  const { data, error } = await db
    .from('opportunities')
    .insert([opportunity])
    .select()
    .single();

  if (error) throw error;

  // Create notification
  await createNotification({
    employee_id: opportunity.employee_id!,
    notification_type: 'opportunity_created',
    title: 'New Opportunity Created',
    message: `Opportunity "${opportunity.opportunity_name}" has been created from lead`,
    related_lead_id: leadId,
    priority: 'high'
  });

  return data as Opportunity;
}

// Opportunities API
export async function getOpportunities(employeeId?: string, status?: string) {
  let query = db.from('opportunities').select('*');

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return data as Opportunity[];
}

export async function updateOpportunity(id: string, updates: Partial<Opportunity>) {
  const { data, error } = await db
    .from('opportunities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Opportunity;
}

export async function closeOpportunity(id: string, status: 'won' | 'lost', actualRevenue?: number) {
  const updates: Partial<Opportunity> = {
    status,
    closed_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  };

  if (actualRevenue !== undefined) {
    updates.actual_revenue = actualRevenue;
  }

  const { data, error } = await db
    .from('opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Opportunity;
}

// Notifications API
export async function createNotification(notification: Partial<Notification>) {
  const { data, error } = await db
    .from('notifications')
    .insert([{
      ...notification,
      sent_at: notification.scheduled_for ? null : new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function getNotifications(employeeId: string, unreadOnly = false) {
  let query = db
    .from('notifications')
    .select('*')
    .eq('employee_id', employeeId);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { data, error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function markAllNotificationsRead(employeeId: string) {
  const { data, error } = await db
    .from('notifications')
    .update({ is_read: true })
    .eq('employee_id', employeeId)
    .eq('is_read', false);

  if (error) throw error;
  return data;
}

// Performance Metrics API
export async function getDailyPerformanceMetrics(employeeId: string, date: string) {
  const { data, error } = await db
    .from('daily_performance_metrics')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('metric_date', date)
    .maybeSingle();

  if (error) throw error;
  return data as DailyPerformanceMetrics | null;
}

export async function getPerformanceMetricsRange(employeeId: string, startDate: string, endDate: string) {
  const { data, error } = await db
    .from('daily_performance_metrics')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true });

  if (error) throw error;
  return data as DailyPerformanceMetrics[];
}

export async function getAllEmployeesPerformanceMetrics(date: string) {
  const { data, error } = await db
    .from('daily_performance_metrics')
    .select(`
      *,
      employee:marketing_employees(full_name, designation)
    `)
    .eq('metric_date', date)
    .order('productivity_score', { ascending: false });

  if (error) throw error;
  return data;
}

// Dashboard Statistics
export async function getDashboardStats(employeeId: string) {
  const today = new Date().toISOString().split('T')[0];

  // Get today's performance metrics
  const todayMetrics = await getDailyPerformanceMetrics(employeeId, today);

  // Get pending follow-ups count
  const pendingFollowUps = await getFollowUpTasks(employeeId, 'pending');

  // Get active leads count
  const activeLeads = await getLeads(employeeId);

  // Get open opportunities
  const openOpportunities = await getOpportunities(employeeId, 'open');

  // Get unread notifications
  const unreadNotifications = await getNotifications(employeeId, true);

  // Calculate expected revenue from open opportunities
  const expectedRevenue = openOpportunities.reduce((sum, opp) => sum + (opp.expected_revenue || 0), 0);

  return {
    todayStats: todayMetrics || {
      planned_visits: 0,
      completed_planned_visits: 0,
      additional_visits: 0,
      total_visits: 0,
      leads_generated: 0,
      opportunities_created: 0
    },
    pendingFollowUps: pendingFollowUps.length,
    activeLeads: activeLeads.length,
    openOpportunities: openOpportunities.length,
    unreadNotifications: unreadNotifications.length,
    expectedRevenue
  };
}
