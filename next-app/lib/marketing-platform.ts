import { HttpError } from '@/lib/marketing-auth';

export type MarketingResource = 'campaigns' | 'metrics' | 'forms' | 'content' | 'workflows';

export const marketingTables: Record<MarketingResource, string> = {
  campaigns: 'marketing_campaigns',
  metrics: 'marketing_metric_periods',
  forms: 'marketing_forms',
  content: 'marketing_content',
  workflows: 'marketing_workflows',
};

function text(value: unknown) {
  return String(value ?? '').trim();
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function date(value: unknown) {
  const result = text(value);
  return result || null;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value).split(',').map(item => item.trim()).filter(Boolean);
}

function slug(value: unknown) {
  return text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formFields(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((field, index) => {
    const row = field && typeof field === 'object' ? field as Record<string, unknown> : {};
    const name = slug(row.name || row.label || `field-${index + 1}`).replace(/-/g, '_');
    return {
      name,
      label: text(row.label) || `Field ${index + 1}`,
      type: ['text', 'email', 'tel', 'textarea', 'select', 'checkbox'].includes(text(row.type))
        ? text(row.type)
        : 'text',
      required: row.required === true,
      placeholder: text(row.placeholder),
      options: list(row.options),
    };
  }).filter(field => field.name && field.label);
}

export function sanitizeMarketingRow(resource: MarketingResource, body: Record<string, unknown>) {
  if (resource === 'campaigns') {
    const name = text(body.name);
    if (!name) throw new HttpError('Campaign name is required', 400);
    return {
      name,
      objective: text(body.objective),
      owner: text(body.owner),
      status: text(body.status) || 'Draft',
      budget: number(body.budget),
      channels: list(body.channels),
      audience: text(body.audience),
      notes: text(body.notes),
      starts_on: date(body.starts_on),
      ends_on: date(body.ends_on),
      archived: body.archived === true,
      updated_at: new Date().toISOString(),
    };
  }

  if (resource === 'metrics') {
    const campaignId = text(body.campaign_id);
    const periodStart = text(body.period_start);
    const periodEnd = text(body.period_end);
    if (!campaignId || !periodStart || !periodEnd) {
      throw new HttpError('Campaign and metric date range are required', 400);
    }
    if (periodEnd < periodStart) throw new HttpError('Period end cannot be before period start', 400);
    return {
      campaign_id: campaignId,
      period_start: periodStart,
      period_end: periodEnd,
      channel: text(body.channel) || 'Other',
      source_type: text(body.source_type) || 'Manual',
      spend: number(body.spend),
      impressions: Math.round(number(body.impressions)),
      reach: Math.round(number(body.reach)),
      clicks: Math.round(number(body.clicks)),
      leads: Math.round(number(body.leads)),
      qualified_leads: Math.round(number(body.qualified_leads)),
      conversions: Math.round(number(body.conversions)),
      pipeline_value: number(body.pipeline_value),
      attributed_revenue: number(body.attributed_revenue),
      notes: text(body.notes),
      updated_at: new Date().toISOString(),
    };
  }

  if (resource === 'forms') {
    const name = text(body.name);
    const formSlug = slug(body.slug || name);
    const fields = formFields(body.fields);
    if (!name || !formSlug) throw new HttpError('Form name and slug are required', 400);
    if (!fields.length) throw new HttpError('Add at least one form field', 400);
    return {
      campaign_id: text(body.campaign_id) || null,
      name,
      slug: formSlug,
      description: text(body.description),
      fields,
      success_message: text(body.success_message) || 'Thank you. We will contact you shortly.',
      redirect_url: text(body.redirect_url),
      status: text(body.status) || 'Draft',
      updated_at: new Date().toISOString(),
    };
  }

  if (resource === 'content') {
    const title = text(body.title);
    if (!title) throw new HttpError('Content title is required', 400);
    return {
      campaign_id: text(body.campaign_id) || null,
      content_type: text(body.content_type) || 'Blog',
      title,
      slug: slug(body.slug || title),
      summary: text(body.summary),
      body: text(body.body),
      owner: text(body.owner),
      audience: text(body.audience),
      keywords: list(body.keywords),
      seo_title: text(body.seo_title),
      meta_description: text(body.meta_description),
      cta_text: text(body.cta_text),
      cta_url: text(body.cta_url),
      due_date: date(body.due_date),
      status: text(body.status) || 'Draft',
      asset_urls: list(body.asset_urls),
      notes: text(body.notes),
      updated_at: new Date().toISOString(),
    };
  }

  const name = text(body.name);
  if (!name) throw new HttpError('Workflow name is required', 400);
  return {
    name,
    description: text(body.description),
    trigger_type: text(body.trigger_type) || 'form_submission',
    trigger_form_id: text(body.trigger_form_id) || null,
    trigger_status: text(body.trigger_status),
    conditions: body.conditions && typeof body.conditions === 'object' ? body.conditions : {},
    status: text(body.status) || 'Draft',
    updated_at: new Date().toISOString(),
  };
}

export function sanitizeWorkflowSteps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((step, index) => {
    const row = step && typeof step === 'object' ? step as Record<string, unknown> : {};
    return {
      position: index + 1,
      action_type: text(row.action_type) || 'simulated_email',
      subject: text(row.subject),
      content: text(row.content),
      delay_hours: Math.round(number(row.delay_hours)),
    };
  });
}

export function metricKpis(rows: Record<string, unknown>[]) {
  const totals = rows.reduce<Record<string, number>>((result, row) => {
    for (const key of [
      'spend', 'impressions', 'reach', 'clicks', 'leads', 'qualified_leads',
      'conversions', 'pipeline_value', 'attributed_revenue',
    ]) {
      result[key] = (result[key] || 0) + number(row[key]);
    }
    return result;
  }, {});

  return {
    ...totals,
    ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
    conversion_rate: totals.leads ? (totals.conversions / totals.leads) * 100 : 0,
    cpl: totals.leads ? totals.spend / totals.leads : 0,
    cpa: totals.conversions ? totals.spend / totals.conversions : 0,
    roas: totals.spend ? totals.attributed_revenue / totals.spend : 0,
    roi: totals.spend ? ((totals.attributed_revenue - totals.spend) / totals.spend) * 100 : 0,
  };
}
