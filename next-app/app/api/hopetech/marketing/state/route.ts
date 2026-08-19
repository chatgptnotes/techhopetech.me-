import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';
import { apiError } from '@/lib/api';
import { requireMarketingAdmin } from '@/lib/marketing-auth';
import { metricKpis } from '@/lib/marketing-platform';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMarketingAdmin(request);
    const [
      campaigns, metrics, forms, submissions, content, workflows, steps,
      enrollments, activities, touchpoints, contacts, posts, responses, accounts, syncLogs,
    ] = await Promise.all([
      db.from('marketing_campaigns').select('*').eq('archived', false).order('updated_at', { ascending: false }),
      db.from('marketing_metric_periods').select('*').order('period_start', { ascending: false }),
      db.from('marketing_forms').select('*').order('updated_at', { ascending: false }),
      db.from('marketing_form_submissions').select('*').order('submitted_at', { ascending: false }).limit(250),
      db.from('marketing_content').select('*').order('updated_at', { ascending: false }),
      db.from('marketing_workflows').select('*').order('updated_at', { ascending: false }),
      db.from('marketing_workflow_steps').select('*').order('position'),
      db.from('marketing_workflow_enrollments').select('*').order('enrolled_at', { ascending: false }).limit(250),
      db.from('marketing_activity_events').select('*').order('occurred_at', { ascending: false }).limit(250),
      db.from('marketing_attribution_touchpoints').select('*').order('touched_at', { ascending: false }).limit(500),
      db.from('bni_contacts').select('id,first,last,email,phone,company,status,source,campaign,updated_at').order('updated_at', { ascending: false }),
      db.from('marketing_social_posts').select('*').order('created_at', { ascending: false }).limit(250),
      db.from('marketing_social_responses').select('*').order('provider_created_at', { ascending: false, nullsFirst: false }).limit(250),
      db.from('marketing_social_accounts').select('id,provider,organization_name,status,last_error,updated_at'),
      db.from('marketing_sync_logs').select('*').order('started_at', { ascending: false }).limit(20),
    ]);

    const results = [
      campaigns, metrics, forms, submissions, content, workflows, steps,
      enrollments, activities, touchpoints, contacts, posts, responses, accounts, syncLogs,
    ];
    const firstError = results.find(result => result.error)?.error;
    if (firstError) throw firstError;

    const workflowRows = (workflows.data || []).map(workflow => ({
      ...workflow,
      steps: (steps.data || []).filter(step => step.workflow_id === workflow.id),
    }));
    const metricRows = metrics.data || [];
    const contactRows = contacts.data || [];
    const qualified = new Set(['Contacted', 'Meeting Scheduled', 'Met', 'Follow-up', 'Converted']);

    return NextResponse.json({
      user: { id: user.id, email: user.email || '' },
      campaigns: campaigns.data || [],
      metrics: metricRows,
      forms: forms.data || [],
      submissions: submissions.data || [],
      content: content.data || [],
      workflows: workflowRows,
      enrollments: enrollments.data || [],
      activities: activities.data || [],
      touchpoints: touchpoints.data || [],
      contacts: contactRows,
      posts: posts.data || [],
      responses: responses.data || [],
      accounts: accounts.data || [],
      syncLogs: syncLogs.data || [],
      kpis: {
        ...metricKpis(metricRows),
        contacts: contactRows.length,
        qualified_leads: contactRows.filter(contact => qualified.has(contact.status)).length,
        form_submissions: (submissions.data || []).length,
        active_campaigns: (campaigns.data || []).filter(campaign => campaign.status === 'Active').length,
        published_posts: (posts.data || []).filter(post => post.status === 'Published').length,
        open_responses: (responses.data || []).filter(response => !response.resolved).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return apiError(message);
  }
}
