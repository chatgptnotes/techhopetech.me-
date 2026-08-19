import { createHash } from 'node:crypto';
import { db } from '@/lib/supabase-admin';
import { HttpError } from '@/lib/marketing-auth';

const HUBSPOT_BASE = 'https://api.hubapi.com/crm/objects/2026-03/contacts';
const PROPERTIES = ['firstname', 'lastname', 'email', 'phone', 'company', 'lifecyclestage'];

type HubSpotContact = {
  id: string;
  properties: Record<string, string | null>;
  updatedAt: string;
  archived?: boolean;
};

type SyncCounts = {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  conflicts: number;
};

function token() {
  const value = process.env.HUBSPOT_ACCESS_TOKEN || '';
  if (!value) throw new HttpError('HUBSPOT_ACCESS_TOKEN is not configured', 503);
  return value;
}

async function hubspot<T>(path = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new HttpError(`HubSpot request failed (${response.status}): ${detail.slice(0, 300)}`, 502);
  }
  return response.json() as Promise<T>;
}

function lifecycleFromStatus(status: string) {
  const map: Record<string, string> = {
    Identified: 'lead',
    Contacted: 'marketingqualifiedlead',
    'Meeting Scheduled': 'salesqualifiedlead',
    Met: 'opportunity',
    'Follow-up': 'opportunity',
    Converted: 'customer',
    'Not Interested': 'other',
  };
  return map[status] || 'lead';
}

function statusFromLifecycle(stage: string) {
  const map: Record<string, string> = {
    subscriber: 'Identified',
    lead: 'Identified',
    marketingqualifiedlead: 'Contacted',
    salesqualifiedlead: 'Meeting Scheduled',
    opportunity: 'Follow-up',
    customer: 'Converted',
    evangelist: 'Converted',
    other: 'Not Interested',
  };
  return map[stage] || 'Identified';
}

function payloadFromContact(contact: Record<string, unknown>) {
  return {
    firstname: String(contact.first || ''),
    lastname: String(contact.last || ''),
    email: String(contact.email || ''),
    phone: String(contact.phone || ''),
    company: String(contact.company || ''),
    lifecyclestage: lifecycleFromStatus(String(contact.status || 'Identified')),
  };
}

function payloadHash(payload: Record<string, string>) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function allHubSpotContacts() {
  const rows: HubSpotContact[] = [];
  let after = '';
  do {
    const query = new URLSearchParams({
      limit: '100',
      properties: PROPERTIES.join(','),
      archived: 'false',
    });
    if (after) query.set('after', after);
    const page = await hubspot<{
      results: HubSpotContact[];
      paging?: { next?: { after?: string } };
    }>(`?${query}`);
    rows.push(...page.results);
    after = page.paging?.next?.after || '';
  } while (after);
  return rows;
}

export function hubSpotConfigured() {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
}

export async function syncHubSpotContacts() {
  token();
  const startedAt = new Date().toISOString();
  const { data: log, error: logError } = await db.from('marketing_sync_logs').insert({
    provider: 'hubspot',
    direction: 'two-way',
    status: 'Running',
    started_at: startedAt,
  }).select().single();
  if (logError) throw logError;

  const counts: SyncCounts = { processed: 0, created: 0, updated: 0, skipped: 0, conflicts: 0 };
  try {
    const remoteRows = await allHubSpotContacts();
    const { data: mappings, error: mappingError } = await db.from('marketing_hubspot_mappings').select('*');
    if (mappingError) throw mappingError;
    const byRemoteId = new Map((mappings || []).map(row => [row.hubspot_contact_id, row]));

    for (const remote of remoteRows) {
      counts.processed += 1;
      const properties = remote.properties || {};
      const mapping = byRemoteId.get(remote.id);
      let local: Record<string, unknown> | null = null;
      if (mapping) {
        const result = await db.from('bni_contacts').select('*').eq('id', mapping.contact_id).maybeSingle();
        if (result.error) throw result.error;
        local = result.data;
      }
      if (!local && properties.email) {
        const result = await db.from('bni_contacts').select('*').ilike('email', properties.email).limit(1).maybeSingle();
        if (result.error) throw result.error;
        local = result.data;
      }

      const remoteUpdated = new Date(remote.updatedAt).getTime();
      const localUpdated = local ? new Date(String(local.updated_at || 0)).getTime() : 0;
      const lastSynced = mapping?.last_synced_at ? new Date(mapping.last_synced_at).getTime() : 0;
      const bothChanged = localUpdated > lastSynced && remoteUpdated > lastSynced;
      if (bothChanged && localUpdated > remoteUpdated) {
        counts.conflicts += 1;
        continue;
      }

      const localPayload = {
        first: properties.firstname || '',
        last: properties.lastname || '',
        email: properties.email || '',
        phone: properties.phone || '',
        company: properties.company || '',
        status: statusFromLifecycle(properties.lifecyclestage || ''),
        updated_at: remote.updatedAt || new Date().toISOString(),
      };
      if (local) {
        const { error } = await db.from('bni_contacts').update(localPayload).eq('id', local.id);
        if (error) throw error;
        counts.updated += 1;
      } else {
        const { data, error } = await db.from('bni_contacts')
          .insert({ id: crypto.randomUUID(), source: 'HubSpot', ...localPayload })
          .select()
          .single();
        if (error) throw error;
        local = data;
        counts.created += 1;
      }

      await db.from('marketing_hubspot_mappings').upsert({
        contact_id: local?.id,
        hubspot_contact_id: remote.id,
        local_updated_at: localPayload.updated_at,
        hubspot_updated_at: remote.updatedAt,
        last_synced_at: new Date().toISOString(),
        sync_hash: payloadHash({
          firstname: localPayload.first,
          lastname: localPayload.last,
          email: localPayload.email,
          phone: localPayload.phone,
          company: localPayload.company,
          lifecyclestage: properties.lifecyclestage || '',
        }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'contact_id' });
    }

    const { data: localRows, error: localError } = await db.from('bni_contacts').select('*').order('updated_at');
    if (localError) throw localError;
    const { data: currentMappings, error: currentMappingError } = await db.from('marketing_hubspot_mappings').select('*');
    if (currentMappingError) throw currentMappingError;
    const byLocalId = new Map((currentMappings || []).map(row => [row.contact_id, row]));

    for (const local of localRows || []) {
      const properties = payloadFromContact(local);
      if (!properties.email) {
        counts.skipped += 1;
        continue;
      }
      const hash = payloadHash(properties);
      const mapping = byLocalId.get(local.id);
      if (mapping?.sync_hash === hash) {
        counts.skipped += 1;
        continue;
      }

      let remote: HubSpotContact;
      if (mapping) {
        remote = await hubspot<HubSpotContact>(`/${encodeURIComponent(mapping.hubspot_contact_id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ properties }),
        });
        counts.updated += 1;
      } else {
        remote = await hubspot<HubSpotContact>('', {
          method: 'POST',
          body: JSON.stringify({ properties }),
        });
        counts.created += 1;
      }
      counts.processed += 1;
      await db.from('marketing_hubspot_mappings').upsert({
        contact_id: local.id,
        hubspot_contact_id: remote.id,
        local_updated_at: local.updated_at,
        hubspot_updated_at: remote.updatedAt,
        last_synced_at: new Date().toISOString(),
        sync_hash: hash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'contact_id' });
    }

    await db.from('marketing_sync_logs').update({
      status: counts.conflicts ? 'Completed with conflicts' : 'Completed',
      records_processed: counts.processed,
      records_created: counts.created,
      records_updated: counts.updated,
      records_skipped: counts.skipped,
      details: { conflicts: counts.conflicts },
      completed_at: new Date().toISOString(),
    }).eq('id', log.id);
    return counts;
  } catch (error) {
    await db.from('marketing_sync_logs').update({
      status: 'Failed',
      records_processed: counts.processed,
      records_created: counts.created,
      records_updated: counts.updated,
      records_skipped: counts.skipped,
      error_message: error instanceof Error ? error.message : 'HubSpot sync failed',
      completed_at: new Date().toISOString(),
    }).eq('id', log.id);
    throw error;
  }
}
