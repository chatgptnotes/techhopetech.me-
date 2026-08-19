import { db } from '@/lib/supabase-admin';
import {
  fetchLinkedInPostActivity,
  publishLinkedInPost,
  type SocialAccount,
  type SocialPost,
} from '@/lib/linkedin';
import {
  fetchInstagramPostActivity,
  publishInstagramPost,
  type InstagramAccount,
  type InstagramPost,
} from '@/lib/instagram';
import { HttpError } from '@/lib/marketing-auth';

type PostRow = SocialPost & {
  channel: string;
  status: string;
  scheduled_for: string | null;
  attempt_count: number;
};

type AccountRow = SocialAccount & {
  provider: string;
  member_urn: string;
};

function providerDate(value: unknown) {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return new Date(numeric).toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function event(campaignId: string | null, eventType: string, payload: Record<string, unknown>) {
  await db.from('marketing_campaign_events').insert({
    campaign_id: campaignId,
    event_type: eventType,
    payload,
  });
}

async function accountForPost(post: PostRow) {
  if (!post.provider_account_id) {
    const provider = String(post.channel || '').toLowerCase();
    const { data: connected, error: lookupError } = await db
      .from('marketing_social_accounts')
      .select('*')
      .eq('provider', provider)
      .eq('status', 'Connected')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!connected) {
      throw new HttpError(`Connect ${post.channel || 'a social account'} before publishing`, 409);
    }
    await db
      .from('marketing_social_posts')
      .update({ provider_account_id: connected.id, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    return connected as AccountRow;
  }
  const { data, error } = await db
    .from('marketing_social_accounts')
    .select('*')
    .eq('id', post.provider_account_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError('The connected social account for this post is unavailable', 409);
  return data as AccountRow;
}

export async function publishPostById(postId: string) {
  const { data: existing, error } = await db
    .from('marketing_social_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();
  if (error) throw error;
  if (!existing) throw new HttpError('Post not found', 404);
  if (existing.status === 'Published') return existing;

  const allowed = ['Draft', 'Scheduled', 'Failed', 'Needs Review'];
  if (!allowed.includes(existing.status)) {
    throw new HttpError(`Post cannot be published while it is ${existing.status}`, 409);
  }

  const attemptAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from('marketing_social_posts')
    .update({
      status: 'Publishing',
      publish_error: '',
      last_attempt_at: attemptAt,
      attempt_count: Number(existing.attempt_count || 0) + 1,
      updated_at: attemptAt,
    })
    .eq('id', postId)
    .in('status', allowed)
    .select('*')
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new HttpError('Another worker is already publishing this post', 409);

  try {
    const account = await accountForPost(claimed as PostRow);
    const provider = account.provider.toLowerCase();
    const published = provider === 'instagram'
      ? await publishInstagramPost(account as InstagramAccount, claimed as InstagramPost)
      : await publishLinkedInPost(account, claimed as PostRow);
    const now = new Date().toISOString();
    const { data, error: updateError } = await db
      .from('marketing_social_posts')
      .update({
        status: 'Published',
        external_post_urn: published.urn,
        post_url: published.url,
        published_at: now,
        publish_error: '',
        next_attempt_at: null,
        updated_at: now,
      })
      .eq('id', postId)
      .select('*')
      .single();
    if (updateError) throw updateError;
    await event(claimed.campaign_id, 'social_post_published', {
      post_id: postId,
      provider,
      external_post_urn: published.urn,
    });
    return data;
  } catch (error) {
    const providerStatus = Number((error as { providerStatus?: number }).providerStatus || 0);
    const safeToRetry = providerStatus === 429;
    const status = safeToRetry ? 'Scheduled' : 'Needs Review';
    const retryAt = safeToRetry ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
    const message = error instanceof Error ? error.message : 'Social publishing failed';
    await db.from('marketing_social_posts').update({
      status,
      publish_error: message,
      next_attempt_at: retryAt,
      updated_at: new Date().toISOString(),
    }).eq('id', postId);
    await event(claimed.campaign_id, 'social_post_publish_failed', {
      post_id: postId,
      provider_status: providerStatus || null,
      safe_to_retry: safeToRetry,
      error: message,
    });
    throw error;
  }
}

export async function publishDuePosts(limit = 20) {
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('marketing_social_posts')
    .select('id')
    .eq('status', 'Scheduled')
    .lte('scheduled_for', now)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order('scheduled_for', { ascending: true })
    .limit(limit);
  if (error) throw error;

  const results = [];
  for (const post of data || []) {
    try {
      const published = await publishPostById(post.id);
      results.push({ id: post.id, status: published.status });
    } catch (publishError) {
      results.push({
        id: post.id,
        status: 'error',
        error: publishError instanceof Error ? publishError.message : 'Publish failed',
      });
    }
  }
  return results;
}

export async function syncPostById(postId: string) {
  const { data: post, error } = await db
    .from('marketing_social_posts')
    .select('*')
    .eq('id', postId)
    .eq('status', 'Published')
    .maybeSingle();
  if (error) throw error;
  if (!post?.external_post_urn) throw new HttpError('Published social post not found', 404);
  const account = await accountForPost(post as PostRow);
  if (account.provider.toLowerCase() === 'instagram') {
    const activity = await fetchInstagramPostActivity(
      account as InstagramAccount,
      post.external_post_urn,
    );
    const now = new Date().toISOString();
    const commentCount = Number(activity.comments_count || 0);
    const reactionCount = Number(activity.like_count || 0);
    const { error: updateError } = await db.from('marketing_social_posts').update({
      post_url: activity.permalink || post.post_url,
      engagement: commentCount + reactionCount,
      comment_count: commentCount,
      reaction_count: reactionCount,
      last_synced_at: now,
      updated_at: now,
    }).eq('id', post.id);
    if (updateError) throw updateError;
    await event(post.campaign_id, 'social_post_synced', {
      post_id: post.id,
      provider: 'instagram',
      comments: commentCount,
      reactions: reactionCount,
    });
    return {
      postId: post.id,
      comments: commentCount,
      reactions: reactionCount,
    };
  }
  const activity = await fetchLinkedInPostActivity(account, post.external_post_urn);
  const now = new Date().toISOString();

  const responses = [
    ...activity.comments.map(comment => {
      const commentId = String(comment.id || comment.commentUrn || '');
      return {
        post_id: post.id,
        campaign_id: post.campaign_id,
        provider: 'linkedin',
        external_response_id: commentId,
        parent_external_id: String(comment.parentComment || ''),
        response_type: comment.parentComment ? 'reply' : 'comment',
        author_urn: String(comment.actor || ''),
        author_name: '',
        body: String(comment.message?.text || ''),
        reaction_type: '',
        provider_created_at: providerDate(comment.created?.time),
        provider_updated_at: providerDate(comment.lastModified?.time),
        updated_at: now,
      };
    }),
    ...activity.reactions.map(reaction => ({
      post_id: post.id,
      campaign_id: post.campaign_id,
      provider: 'linkedin',
      external_response_id: String(reaction.id || `${reaction.actor || 'unknown'}:${reaction.reactionType || 'LIKE'}`),
      parent_external_id: '',
      response_type: 'reaction',
      author_urn: String(reaction.actor || reaction.created?.actor || ''),
      author_name: '',
      body: '',
      reaction_type: String(reaction.reactionType || 'LIKE'),
      provider_created_at: providerDate(reaction.created?.time),
      provider_updated_at: providerDate(reaction.lastModified?.time),
      updated_at: now,
    })),
  ].filter(row => row.external_response_id);

  if (responses.length) {
    const { error: responseError } = await db
      .from('marketing_social_responses')
      .upsert(responses, { onConflict: 'provider,external_response_id' });
    if (responseError) throw responseError;
  }

  const stats = activity.statistics as Record<string, unknown>;
  const commentCount = Number(stats.commentCount ?? activity.comments.length);
  const reactionCount = Number(stats.likeCount ?? activity.reactions.length);
  const shareCount = Number(stats.shareCount || 0);
  const { error: updateError } = await db.from('marketing_social_posts').update({
    clicks: Number(stats.clickCount || 0),
    impressions: Number(stats.impressionCount || 0),
    engagement: commentCount + reactionCount + shareCount,
    comment_count: commentCount,
    reaction_count: reactionCount,
    last_synced_at: now,
    updated_at: now,
  }).eq('id', post.id);
  if (updateError) throw updateError;

  await event(post.campaign_id, 'social_post_synced', {
    post_id: post.id,
    comments: activity.comments.length,
    reactions: activity.reactions.length,
  });
  return {
    postId: post.id,
    comments: activity.comments.length,
    reactions: activity.reactions.length,
  };
}

export async function syncRecentPosts(limit = 20) {
  const { data, error } = await db
    .from('marketing_social_posts')
    .select('id')
    .eq('status', 'Published')
    .not('external_post_urn', 'is', null)
    .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw error;

  const results = [];
  for (const post of data || []) {
    try {
      results.push(await syncPostById(post.id));
    } catch (syncError) {
      results.push({
        postId: post.id,
        error: syncError instanceof Error ? syncError.message : 'Sync failed',
      });
    }
  }

  await db
    .from('marketing_social_webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .is('processed_at', null);
  return results;
}
