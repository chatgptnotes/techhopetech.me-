import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';
import { routeError } from '@/lib/api';
import { HttpError, requireMarketingAdmin } from '@/lib/marketing-auth';
import {
  marketingTables,
  type MarketingResource,
  sanitizeMarketingRow,
  sanitizeWorkflowSteps,
} from '@/lib/marketing-platform';

function resourceFrom(value: string): MarketingResource {
  if (value in marketingTables) return value as MarketingResource;
  throw new HttpError('Unknown marketing resource', 404);
}

async function paramsResource(context: { params: Promise<{ resource: string }> }) {
  return resourceFrom((await context.params).resource);
}

export async function GET(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    await requireMarketingAdmin(request);
    const resource = await paramsResource(context);
    const table = marketingTables[resource];
    let query = db.from(table).select('*');
    if (resource === 'campaigns') query = query.eq('archived', false).order('updated_at', { ascending: false });
    else query = query.order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;

    if (resource !== 'workflows') return NextResponse.json(data || []);
    const { data: steps, error: stepError } = await db
      .from('marketing_workflow_steps')
      .select('*')
      .order('position');
    if (stepError) throw stepError;
    return NextResponse.json((data || []).map(workflow => ({
      ...workflow,
      steps: (steps || []).filter(step => step.workflow_id === workflow.id),
    })));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    const user = await requireMarketingAdmin(request);
    const resource = await paramsResource(context);
    const body = await request.json() as Record<string, unknown>;
    const row = sanitizeMarketingRow(resource, body);
    const insert: Record<string, unknown> = { ...row };
    if (resource === 'campaigns') insert.id = crypto.randomUUID();
    else insert.created_by = user.id;

    const { data, error } = await db.from(marketingTables[resource]).insert(insert).select().single();
    if (error) throw error;

    if (resource === 'workflows') {
      const steps = sanitizeWorkflowSteps(body.steps).map(step => ({ ...step, workflow_id: data.id }));
      if (steps.length) {
        const { error: stepError } = await db.from('marketing_workflow_steps').insert(steps);
        if (stepError) throw stepError;
      }
      return NextResponse.json({ ...data, steps }, { status: 201 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    await requireMarketingAdmin(request);
    const resource = await paramsResource(context);
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id || '');
    if (!id) throw new HttpError('Record ID is required', 400);
    const row = sanitizeMarketingRow(resource, body);
    const { data, error } = await db.from(marketingTables[resource]).update(row).eq('id', id).select().single();
    if (error) throw error;

    if (resource === 'workflows' && Array.isArray(body.steps)) {
      const { error: deleteError } = await db.from('marketing_workflow_steps').delete().eq('workflow_id', id);
      if (deleteError) throw deleteError;
      const steps = sanitizeWorkflowSteps(body.steps).map(step => ({ ...step, workflow_id: id }));
      if (steps.length) {
        const { error: stepError } = await db.from('marketing_workflow_steps').insert(steps);
        if (stepError) throw stepError;
      }
      return NextResponse.json({ ...data, steps });
    }
    return NextResponse.json(data);
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    await requireMarketingAdmin(request);
    const resource = await paramsResource(context);
    const id = request.nextUrl.searchParams.get('id') || '';
    if (!id) throw new HttpError('Record ID is required', 400);
    if (resource === 'campaigns') {
      const { error } = await db.from('marketing_campaigns')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await db.from(marketingTables[resource]).delete().eq('id', id);
      if (error) throw error;
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return routeError(error);
  }
}
